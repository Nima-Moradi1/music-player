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
  repeatMode: 'off' | 'one' | 'all';
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
  repeatMode: 'off',
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
    const {trackId, positionMs, queue, repeatMode} = this.state.getState();
    this.storage.set('resume', JSON.stringify({trackId, positionMs, queue, repeatMode}));
  }

  async restore(): Promise<void> {
    try {
      const saved = JSON.parse(this.storage.getString('resume') ?? 'null') as {
        trackId?: string;
        positionMs?: number;
        queue?: string[];
        repeatMode?: PlayerState['repeatMode'];
      } | null;
      if (!saved?.trackId) {
        return;
      }
      const track = await this.tracks.get(saved.trackId);
      if (!track?.managedPath) {
        return;
      }
      await this.native.load(track.managedPath, track.title, track.artist);
      const positionMs =
        saved.positionMs && saved.positionMs < track.durationMs - 5000 ? saved.positionMs : 0;
      if (positionMs) {
        await this.native.seekTo(positionMs);
      }
      this.state.setState({
        trackId: track.id,
        title: track.title,
        artist: track.artist,
        positionMs,
        durationMs: track.durationMs,
        queue: saved.queue?.filter(id => typeof id === 'string') ?? [track.id],
        repeatMode:
          saved.repeatMode === 'one' || saved.repeatMode === 'all' ? saved.repeatMode : 'off',
      });
      this.startPolling();
    } catch {
      this.storage.remove('resume');
    }
  }

  async load(track: Track, queue: string[] = [track.id]): Promise<void> {
    if (!track.managedPath) {
      throw new Error('This entry has no audio file');
    }
    await this.native.load(track.managedPath, track.title, track.artist);
    await this.native.setABRepeat(-1, -1);
    this.state.setState({
      trackId: track.id,
      title: track.title,
      artist: track.artist,
      playing: false,
      ended: false,
      positionMs: 0,
      durationMs: track.durationMs,
      queue: queue.includes(track.id) ? queue : [track.id, ...queue],
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
      this.state.setState({queue: [...current.queue, track.id]});
      this.save();
    }
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
      this.state.setState({queue: queue.filter(id => id !== previousId)});
      this.save();
      return this.previous();
    }
    const wasPlaying = this.state.getState().playing;
    await this.load(track, this.state.getState().queue);
    if (wasPlaying) {
      await this.native.play();
      this.state.setState({playing: true});
    }
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
      this.state.setState({queue: queue.filter(id => id !== nextId)});
      return this.next(automatic);
    }
    await this.load(track, queue);
    await this.native.play();
    this.state.setState({playing: true});
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
