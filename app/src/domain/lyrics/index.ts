import type {TrackIdentity} from '../track';
export type LyricsCandidate = {
  id: string;
  provider: string;
  artist: string;
  title: string;
  durationMs: number;
  synced: boolean;
};
export type LyricsDocument = {
  id: string;
  text: string;
  lines: {atMs: number; text: string}[];
  offsetMs: number;
  license: string;
};
export interface LyricsProvider {
  find(track: TrackIdentity): Promise<LyricsCandidate[]>;
  get(id: string): Promise<LyricsDocument | null>;
}
