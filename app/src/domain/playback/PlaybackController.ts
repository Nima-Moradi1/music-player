import {createMMKV} from 'react-native-mmkv';
import {createStore} from 'zustand/vanilla';
import type {Track, TrackRepository} from '../track';
import type {NativeAudioV1, NativePlaybackState} from '../../native/NativeAudio';

export type PlayerState = {
  trackId: string | null;
  title: string;
  artist: string;
  playing: boolean;
  ended: boolean;
  positionMs: number;
  durationMs: number;
  queue: string[];
  unshuffledQueue: string[];
  shuffle: boolean;
  repeatMode: 'off' | 'one' | 'all';
  rate: 1 | 1.25 | 1.5 | 2;
  sleepUntilMs: number | null;
  repeatStartMs: number | null;
  repeatEndMs: number | null;
  error: string | null;
};

const empty: PlayerState = {
  trackId: null,
  title: '',
  artist: '',
  playing: false,
  ended: false,
  positionMs: 0,
  durationMs: 0,
  queue: [],
  unshuffledQueue: [],
  shuffle: false,
  repeatMode: 'off',
  rate: 1,
  sleepUntilMs: null,
  repeatStartMs: null,
  repeatEndMs: null,
  error: null,
};

export class PlaybackController {
  readonly state = createStore<PlayerState>(() => empty);
  private readonly storage = createMMKV({id: 'playback.v1'});
  private polling: ReturnType<typeof setInterval> | null = null;
  private busy = false;

  constructor(
    private readonly native: NativeAudioV1,
    private readonly tracks: TrackRepository,
  ) {}

  private save() {
    const {trackId, positionMs, queue, unshuffledQueue, shuffle, repeatMode, rate} =
      this.state.getState();
    this.storage.set(
      'resume',
      JSON.stringify({trackId, positionMs, queue, unshuffledQueue, shuffle, repeatMode, rate}),
    );
  }

  async restore(): Promise<void> {
    try {
      const saved = JSON.parse(this.storage.getString('resume') ?? 'null') as {
        trackId?: string;
        positionMs?: number;
        queue?: string[];
        unshuffledQueue?: string[];
        shuffle?: boolean;
        repeatMode?: PlayerState['repeatMode'];
        rate?: PlayerState['rate'];
      } | null;
      if (!saved?.trackId) {
        return;
      }
      const track = await this.tracks.get(saved.trackId);
      if (!track?.managedPath) {
        return;
      }
      await this.native.load(track.managedPath, track.title, track.artist);
      const rate = saved.rate === 1.25 || saved.rate === 1.5 || saved.rate === 2 ? saved.rate : 1;
      await this.native.setRate(rate);
      const positionMs =
        saved.positionMs && saved.positionMs < track.durationMs - 5000 ? saved.positionMs : 0;
      if (positionMs) {
        await this.native.seekTo(positionMs);
      }
      const queue = [...new Set((saved.queue ?? []).filter(id => typeof id === 'string'))];
      if (!queue.includes(track.id)) queue.unshift(track.id);
      const unshuffledQueue = [
        ...new Set((saved.unshuffledQueue ?? queue).filter(id => typeof id === 'string')),
      ];
      if (!unshuffledQueue.includes(track.id)) unshuffledQueue.unshift(track.id);
      this.state.setState({
        trackId: track.id,
        title: track.title,
        artist: track.artist,
        positionMs,
        durationMs: track.durationMs,
        queue,
        unshuffledQueue,
        shuffle: saved.shuffle === true,
        repeatMode:
          saved.repeatMode === 'one' || saved.repeatMode === 'all' ? saved.repeatMode : 'off',
        rate,
      });
      this.startPolling();
    } catch {
      this.storage.remove('resume');
    }
  }

  async load(track: Track, queue: string[] = [track.id], preserveOrder = false): Promise<void> {
    if (!track.managedPath) {
      throw new Error('This entry has no audio file');
    }
    await this.native.load(track.managedPath, track.title, track.artist);
    await this.native.setRate(this.state.getState().rate);
    await this.native.setABRepeat(-1, -1);
    const activeQueue = queue.includes(track.id) ? queue : [track.id, ...queue];
    this.state.setState({
      trackId: track.id,
      title: track.title,
      artist: track.artist,
      playing: false,
      ended: false,
      positionMs: 0,
      durationMs: track.durationMs,
      queue: activeQueue,
      unshuffledQueue: preserveOrder ? this.state.getState().unshuffledQueue : activeQueue,
      shuffle: preserveOrder ? this.state.getState().shuffle : false,
      repeatStartMs: null,
      repeatEndMs: null,
      error: null,
    });
    this.save();
    this.startPolling();
  }

  async playTrack(track: Track): Promise<void> {
    try {
      if (this.state.getState().trackId !== track.id) {
        await this.load(track);
      }
      await this.native.play();
      this.state.setState({playing: true, ended: false, error: null});
    } catch (error) {
      this.state.setState({playing: false, error: String(error)});
      throw error;
    }
  }

  async toggle(): Promise<void> {
    if (this.state.getState().playing) {
      await this.native.pause();
      this.state.setState({playing: false});
      this.save();
    } else {
      if (this.state.getState().ended) {
        await this.native.seekTo(0);
      }
      await this.native.play();
      this.state.setState({playing: true, ended: false});
      if (!this.polling) {
        this.startPolling();
      }
    }
  }

  enqueue(track: Track): void {
    if (!track.managedPath) {
      throw new Error('This entry has no audio file');
    }
    const current = this.state.getState();
    if (!current.trackId) {
      throw new Error('Play a song before adding to the queue');
    }
    if (!current.queue.includes(track.id)) {
      this.state.setState({
        queue: [...current.queue, track.id],
        unshuffledQueue: [...current.unshuffledQueue, track.id],
      });
      this.save();
    }
  }

  removeFromQueue(trackId: string): void {
    const current = this.state.getState();
    if (trackId === current.trackId) return;
    this.state.setState({
      queue: current.queue.filter(id => id !== trackId),
      unshuffledQueue: current.unshuffledQueue.filter(id => id !== trackId),
    });
    this.save();
  }

  setShuffle(enabled: boolean): void {
    const current = this.state.getState();
    if (current.shuffle === enabled) return;
    if (!enabled) {
      this.state.setState({queue: current.unshuffledQueue, shuffle: false});
    } else {
      const index = Math.max(0, current.queue.indexOf(current.trackId ?? ''));
      const upcoming = current.queue.slice(index + 1);
      for (let i = upcoming.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [upcoming[i], upcoming[j]] = [upcoming[j]!, upcoming[i]!];
      }
      this.state.setState({
        queue: [...current.queue.slice(0, index + 1), ...upcoming],
        unshuffledQueue: current.queue,
        shuffle: true,
      });
    }
    this.save();
  }

  async setSleepTimer(minutes: number): Promise<void> {
    if (minutes !== 0 && minutes !== 30) {
      throw new Error('Invalid sleep timer');
    }
    await this.native.setSleepTimer(minutes * 60);
    this.state.setState({sleepUntilMs: minutes ? Date.now() + minutes * 60000 : null});
  }

  async setABRepeat(startMs: number | null, endMs: number | null): Promise<void> {
    await this.native.setABRepeat(startMs ?? -1, endMs ?? -1);
    this.state.setState({repeatStartMs: startMs, repeatEndMs: endMs});
  }

  async markRepeatStart(ms: number): Promise<void> {
    await this.native.setABRepeat(-1, -1);
    this.state.setState({repeatStartMs: ms, repeatEndMs: null});
  }

  async seekTo(ms: number): Promise<void> {
    const duration = this.state.getState().durationMs;
    const positionMs = Math.max(0, Math.min(ms, duration));
    await this.native.seekTo(positionMs);
    this.state.setState({positionMs});
    this.save();
  }

  setRepeatMode(mode: PlayerState['repeatMode']): void {
    this.state.setState({repeatMode: mode});
    this.save();
  }

  async setRate(rate: PlayerState['rate']): Promise<void> {
    await this.native.setRate(rate);
    this.state.setState({rate});
    this.save();
  }

  async previous(): Promise<void> {
    const {queue, trackId, positionMs} = this.state.getState();
    if (positionMs > 3000) {
      await this.seekTo(0);
      return;
    }
    const previousId = queue[queue.indexOf(trackId ?? '') - 1];
    if (!previousId) {
      await this.seekTo(0);
      return;
    }
    const track = await this.tracks.get(previousId);
    if (!track?.managedPath) {
      this.removeFromQueue(previousId);
      return this.previous();
    }
    const wasPlaying = this.state.getState().playing;
    await this.skipTo(previousId, wasPlaying);
  }

  async next(automatic = false): Promise<void> {
    const {queue, trackId, repeatMode} = this.state.getState();
    if (automatic && repeatMode === 'one') {
      await this.native.seekTo(0);
      await this.native.play();
      this.state.setState({positionMs: 0, playing: true, ended: false});
      this.save();
      return;
    }
    const nextId =
      queue[queue.indexOf(trackId ?? '') + 1] ??
      (automatic && repeatMode === 'all' ? queue[0] : undefined);
    if (!nextId) {
      await this.native.pause();
      this.state.setState({playing: false, ended: true});
      if (this.polling) {
        clearInterval(this.polling);
        this.polling = null;
      }
      return;
    }
    const track = await this.tracks.get(nextId);
    if (!track?.managedPath) {
      this.removeFromQueue(nextId);
      return this.next(automatic);
    }
    await this.skipTo(nextId);
  }

  async skipTo(trackId: string, autoplay = true): Promise<void> {
    const queue = this.state.getState().queue;
    if (!queue.includes(trackId)) throw new Error('Track is not in the queue');
    const track = await this.tracks.get(trackId);
    if (!track?.managedPath) {
      this.removeFromQueue(trackId);
      throw new Error('Queued track is unavailable');
    }
    await this.load(track, queue, true);
    if (autoplay) {
      await this.native.play();
      this.state.setState({playing: true});
    }
  }

  private startPolling() {
    if (this.polling) {
      clearInterval(this.polling);
    }
    this.polling = setInterval(() => {
      void this.refresh();
    }, 1000);
  }

  async refresh(): Promise<void> {
    if (this.busy || !this.state.getState().trackId) {
      return;
    }
    this.busy = true;
    try {
      const native = JSON.parse(await this.native.getState()) as NativePlaybackState;
      if (native.ended) {
        await this.next(true);
        return;
      }
      this.state.setState({
        playing: native.playing,
        ended: false,
        positionMs: native.positionMs,
        durationMs: native.durationMs || this.state.getState().durationMs,
        sleepUntilMs:
          (this.state.getState().sleepUntilMs ?? Infinity) <= Date.now()
            ? null
            : this.state.getState().sleepUntilMs,
      });
      this.save();
    } catch (error) {
      this.state.setState({playing: false, error: String(error)});
    } finally {
      this.busy = false;
    }
  }
}
