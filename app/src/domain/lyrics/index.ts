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

export interface LyricsRepository {
  getLocal(trackId: string): Promise<LyricsDocument | null>;
  saveLocal(trackId: string, text: string, offsetMs: number): Promise<LyricsDocument>;
  saveEmbedded(trackId: string, text: string): Promise<LyricsDocument>;
}

export function parseLrc(text: string): LyricsDocument['lines'] {
  const lines: LyricsDocument['lines'] = [];
  for (const raw of text.split(/\r?\n/)) {
    const tags = [...raw.matchAll(/\[(\d{1,2}):(\d{2})(?:[.:](\d{1,3}))?\]/g)];
    const content = raw.replace(/\[\d{1,2}:\d{2}(?:[.:]\d{1,3})?\]/g, '').trim();
    if (!content) continue;
    for (const tag of tags) {
      const minutes = Number(tag[1]);
      const seconds = Number(tag[2]);
      if (seconds > 59) continue;
      const fraction = Number((tag[3] ?? '').padEnd(3, '0'));
      lines.push({atMs: minutes * 60000 + seconds * 1000 + fraction, text: content});
    }
  }
  return lines.sort((a, b) => a.atMs - b.atMs);
}

export function activeLineIndex(
  lines: LyricsDocument['lines'],
  positionMs: number,
  offsetMs: number,
): number {
  const time = positionMs - offsetMs;
  let low = 0;
  let high = lines.length;
  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    if (lines[mid]!.atMs <= time) low = mid + 1;
    else high = mid;
  }
  return low - 1;
}
