import type {Track} from '../track';
import type {Unsubscribe} from '../../shared/errors';
export type RepeatMode = 'off' | 'all' | 'one';
export type PlayableTrack = Pick<
  Track,
  'id' | 'canonicalUri' | 'title' | 'artist' | 'durationMs' | 'artworkPath'
>;
export type EqualizerConfig = {
  enabled: boolean;
  preampDb: number;
  bands: {frequencyHz: number; gainDb: number}[];
};
export type PlaybackSnapshot = {
  version: 1;
  trackId: string | null;
  positionMs: number;
  durationMs: number;
  state:
    | 'user-paused'
    | 'playing'
    | 'interrupted-while-playing'
    | 'interrupted-while-paused'
    | 'buffering'
    | 'ended'
    | 'error';
  repeat: RepeatMode;
  shuffle: boolean;
};
export type PlaybackListener = (snapshot: PlaybackSnapshot) => void;
export interface AudioEngine {
  load(track: PlayableTrack): Promise<void>;
  play(): Promise<void>;
  pause(): Promise<void>;
  stop(): Promise<void>;
  seekTo(ms: number): Promise<void>;
  setVolume(value: number): Promise<void>;
  setRate(value: number): Promise<void>;
  setPitch(value: number): Promise<void>;
  setRepeat(mode: RepeatMode): Promise<void>;
  setShuffle(enabled: boolean): Promise<void>;
  setEqualizer(config: EqualizerConfig): Promise<void>;
  setCrossfade(ms: number): Promise<void>;
  getState(): Promise<PlaybackSnapshot>;
  subscribe(listener: PlaybackListener): Unsubscribe;
}
