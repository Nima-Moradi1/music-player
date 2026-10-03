import type {TelegramCandidate} from './scanner';

type Job<T> = {
  key: string;
  candidate: TelegramCandidate;
  resolve(value: T): void;
  reject(reason: unknown): void;
};

/** Bounded in-memory scheduler; history cursors provide crash-safe replay. */
export class TelegramImportQueue<T> {
  private pending: Job<T>[] = [];
  private inflight = new Map<string, Promise<T>>();
  private controllers = new Set<AbortController>();
  private active = 0;
  private paused = false;
  private closed = false;

  constructor(
    private readonly process: (candidate: TelegramCandidate, signal: AbortSignal) => Promise<T>,
    private readonly concurrency = 2,
    private readonly capacity = 100,
  ) {
    if (concurrency < 1 || concurrency > 4 || capacity < concurrency) {
      throw new Error('Invalid Telegram queue limits');
    }
  }

  enqueue(candidate: TelegramCandidate): Promise<T> {
    if (this.closed) return Promise.reject(new Error('Telegram disconnected'));
    const key = `${candidate.chatId}:${candidate.id}`;
    const existing = this.inflight.get(key);
    if (existing) return existing;
    if (this.pending.length + this.active >= this.capacity) {
      return Promise.reject(new Error('Telegram queue is full'));
    }
    const promise = new Promise<T>((resolve, reject) => {
      this.pending.push({key, candidate, resolve, reject});
    });
    this.inflight.set(key, promise);
    this.drain();
    return promise;
  }

  pause() {
    this.paused = true;
    for (const controller of this.controllers) controller.abort();
  }

  resume() {
    if (this.closed) return;
    this.paused = false;
    this.drain();
  }

  disconnect() {
    this.closed = true;
    this.paused = true;
    for (const controller of this.controllers) controller.abort();
    for (const job of this.pending.splice(0)) {
      this.inflight.delete(job.key);
      job.reject(new Error('Telegram disconnected'));
    }
  }

  private drain() {
    while (!this.paused && !this.closed && this.active < this.concurrency && this.pending.length) {
      const job = this.pending.shift()!;
      const controller = new AbortController();
      this.controllers.add(controller);
      this.active++;
      void Promise.resolve()
        .then(() => this.process(job.candidate, controller.signal))
        .then(job.resolve, job.reject)
        .finally(() => {
          this.controllers.delete(controller);
          this.inflight.delete(job.key);
          this.active--;
          this.drain();
        });
    }
  }
}
