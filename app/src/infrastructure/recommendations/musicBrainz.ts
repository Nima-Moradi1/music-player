import {normalizeSearch} from '../../domain/track/normalize';

export type OnlineRecording = {
  id: string;
  title: string;
  artist: string;
  sourceUrl: string;
  reason: 'artist' | 'genre';
};

type MusicBrainzRecording = {
  id?: unknown;
  title?: unknown;
  'artist-credit'?: unknown;
  tags?: unknown;
};

const endpoint = 'https://musicbrainz.org/ws/2/recording/';
const userAgent = 'MusicPlayer/0.1.0 (https://github.com/Nima-Moradi1/music-player)';
let nextRequestAt = 0;

function artistCredit(value: unknown): string {
  if (!Array.isArray(value)) return '';
  return value
    .map(entry =>
      entry && typeof entry === 'object' && 'name' in entry && typeof entry.name === 'string'
        ? entry.name
        : '',
    )
    .filter(Boolean)
    .join(', ');
}

/** Metadata only. A MusicBrainz recording page is not an audio download license. */
export async function findRelatedRecordings(
  input: {title: string; artist: string; genre?: string},
  signal?: AbortSignal,
  fetcher: typeof fetch = fetch,
): Promise<OnlineRecording[]> {
  const artist = input.artist.trim().slice(0, 120);
  if (!artist || artist.toLowerCase() === 'unknown artist') return [];
  const delay = Math.max(0, nextRequestAt - Date.now());
  nextRequestAt = Date.now() + delay + 1100;
  if (delay) await new Promise<void>(resolve => setTimeout(resolve, delay));
  if (signal?.aborted) throw new Error('Cancelled');
  const query = `artist:"${artist.replace(/[\\"]/g, ' ').trim()}"`;
  const url = `${endpoint}?query=${encodeURIComponent(query)}&fmt=json&limit=50`;
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener('abort', abort, {once: true});
  const timeout = setTimeout(abort, 10_000);
  let body: unknown;
  try {
    const response = await fetcher(url, {
      headers: {'User-Agent': userAgent, Accept: 'application/json'},
      signal: controller.signal,
    });
    if (!response.ok) throw new Error('Online discovery unavailable');
    body = await response.json();
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', abort);
  }
  const recordings =
    body && typeof body === 'object' && 'recordings' in body && Array.isArray(body.recordings)
      ? (body.recordings as MusicBrainzRecording[])
      : [];
  const wantedArtist = normalizeSearch(artist);
  const wantedTitle = normalizeSearch(input.title);
  const wantedGenre = normalizeSearch(input.genre ?? '');
  const titleTokens = new Set(wantedTitle.split(' ').filter(token => token.length >= 4));
  const titleAffinity = (title: string) =>
    normalizeSearch(title)
      .split(' ')
      .filter(token => titleTokens.has(token)).length;
  const seen = new Set<string>();
  return recordings
    .flatMap(recording => {
      if (
        typeof recording.id !== 'string' ||
        !/^[0-9a-f-]{36}$/i.test(recording.id) ||
        typeof recording.title !== 'string'
      )
        return [];
      const title = recording.title.trim().slice(0, 200);
      const creditedArtist = artistCredit(recording['artist-credit']).slice(0, 200);
      const normalizedTitle = normalizeSearch(title);
      const normalizedArtist = normalizeSearch(creditedArtist);
      if (!title || normalizedTitle === wantedTitle || !normalizedArtist.includes(wantedArtist))
        return [];
      const key = `${normalizedArtist}:${normalizedTitle}`;
      if (seen.has(key)) return [];
      seen.add(key);
      const tags = Array.isArray(recording.tags) ? recording.tags : [];
      const sameGenre =
        !!wantedGenre &&
        tags.some(
          tag =>
            tag &&
            typeof tag === 'object' &&
            'name' in tag &&
            typeof tag.name === 'string' &&
            normalizeSearch(tag.name) === wantedGenre,
        );
      return [
        {
          id: recording.id,
          title,
          artist: creditedArtist,
          sourceUrl: `https://musicbrainz.org/recording/${recording.id}`,
          reason: sameGenre ? ('genre' as const) : ('artist' as const),
        },
      ];
    })
    .sort(
      (a, b) =>
        Number(b.reason === 'genre') - Number(a.reason === 'genre') ||
        titleAffinity(b.title) - titleAffinity(a.title),
    )
    .slice(0, 12);
}
