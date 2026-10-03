import {TelegramImportQueue} from './importQueue';
import type {TelegramCandidate} from './scanner';

const candidate = (id: string): TelegramCandidate => ({
  id,
  chatId: 'chat',
  chatKind: 'savedMessages',
  content: 'audio',
  file: {id, name: 'song.mp3', mimeType: 'audio/mpeg', size: 100},
});

it('bounds active transfers and coalesces duplicate messages', async () => {
  const finish: Array<() => void> = [];
  const process = jest.fn(
    async (_message: TelegramCandidate, _signal: AbortSignal) =>
      new Promise<string>(resolve => finish.push(() => resolve('done'))),
  );
  const queue = new TelegramImportQueue(process, 2, 3);
  const first = queue.enqueue(candidate('1'));
  expect(queue.enqueue(candidate('1'))).toBe(first);
  const second = queue.enqueue(candidate('2'));
  const third = queue.enqueue(candidate('3'));
  await Promise.resolve();
  expect(process).toHaveBeenCalledTimes(2);
  await expect(queue.enqueue(candidate('4'))).rejects.toThrow('full');
  finish[0]!();
  await first;
  await Promise.resolve();
  await Promise.resolve();
  expect(process).toHaveBeenCalledTimes(3);
  finish[1]!();
  finish[2]!();
  await Promise.all([second, third]);
});

it('pauses pending work and disconnects without removing imported files', async () => {
  const process = jest.fn(async () => 'done');
  const queue = new TelegramImportQueue(process);
  queue.pause();
  const pending = queue.enqueue(candidate('1'));
  expect(process).not.toHaveBeenCalled();
  queue.disconnect();
  await expect(pending).rejects.toThrow('disconnected');
});
