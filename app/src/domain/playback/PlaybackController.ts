import {createMMKV} from 'react-native-mmkv';
import {createStore} from 'zustand/vanilla';
import type {Track, TrackRepository} from '../track';
import type {NativeAudioV1, NativePlaybackState} from '../../native/NativeAudio';

export type PlayerState = {
  trackId: string | null;
  title: string;
  artist: string;
  playing: boolean;
  positionMs: number;
  durationMs: number;
  queue: string[];
  error: string | null;
};

const empty: PlayerState = {
  trackId: null,
  title: '',
  artist: '',
  playing: false,
  positionMs: 0,
  durationMs: 0,
  queue: [],
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
    const {trackId, positionMs, queue} = this.state.getState();
    this.storage.set('resume', JSON.stringify({trackId, positionMs, queue}));
  }

  async restore(): Promise<void> {
    try {
      const saved = JSON.parse(this.storage.getString('resume') ?? 'null') as {
        trackId?: string;
        positionMs?: number;
        queue?: string[];
      } | null;
      if (!saved?.trackId) {
        return;
      }
      const track = await this.tracks.get(saved.trackId);
      if (!track?.managedPath) {
        return;
      }
      await this.native.load(track.managedPath, track.title, track.artist);
      if (saved.positionMs && saved.positionMs < track.durationMs - 5000) {
        await this.native.seekTo(saved.positionMs);
      }
      this.state.setState({
        trackId: track.id,
        title: track.title,
        artist: track.artist,
        positionMs: saved.positionMs ?? 0,
        durationMs: track.durationMs,
        queue: saved.queue?.filter(id => typeof id === 'string') ?? [track.id],
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
    this.state.setState({
      trackId: track.id,
      title: track.title,
      artist: track.artist,
      playing: false,
      positionMs: 0,
      durationMs: track.durationMs,
      queue: queue.includes(track.id) ? queue : [track.id, ...queue],
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
      this.state.setState({playing: true, error: null});
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
      await this.native.play();
      this.state.setState({playing: true});
    }
  }

  async seekTo(ms: number): Promise<void> {
    const duration = this.state.getState().durationMs;
    const positionMs = Math.max(0, Math.min(ms, duration));
    await this.native.seekTo(positionMs);
    this.state.setState({positionMs});
    this.save();
  }

  async next(): Promise<void> {
    const {queue, trackId} = this.state.getState();
    const nextId = queue[queue.indexOf(trackId ?? '') + 1];
    if (!nextId) {
      await this.native.pause();
      this.state.setState({playing: false});
      return;
    }
    const track = await this.tracks.get(nextId);
    if (!track?.managedPath) {
      this.state.setState({queue: queue.filter(id => id !== nextId)});
      return this.next();
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
        await this.next();
        return;
      }
      this.state.setState({
        playing: native.playing,
        positionMs: native.positionMs,
        durationMs: native.durationMs || this.state.getState().durationMs,
      });
      this.save();
    } catch (error) {
      this.state.setState({playing: false, error: String(error)});
    } finally {
      this.busy = false;
    }
  }
}
