import type {Track} from '../track';
import {normalizeSearch} from '../track/normalize';

export type LocalRecommendation = {track: Track; reason: 'artist' | 'genre' | 'album'};

export function recommendLocal(
  anchor: Track,
  candidates: Track[],
  locale: 'en' | 'fa',
  limit = 12,
): LocalRecommendation[] {
  const artist = normalizeSearch(anchor.artist);
  const genre = normalizeSearch(anchor.genre);
  const album = normalizeSearch(anchor.album);
  return candidates
    .filter(track => track.id !== anchor.id && !!track.managedPath)
    .map(track => {
      const sameArtist = !!artist && normalizeSearch(track.artist) === artist;
      const sameGenre = !!genre && normalizeSearch(track.genre) === genre;
      const sameAlbum = !!album && normalizeSearch(track.album) === album;
      const reason: LocalRecommendation['reason'] | null = sameArtist
        ? 'artist'
        : sameGenre
          ? 'genre'
          : sameAlbum
            ? 'album'
            : null;
      return {
        track,
        reason,
        score:
          (sameArtist ? 8 : 0) +
          (sameGenre ? 4 : 0) +
          (sameAlbum ? 2 : 0) +
          (locale === 'fa' && track.language === 'fa' ? 1 : 0),
      };
    })
    .filter(
      (item): item is {track: Track; reason: LocalRecommendation['reason']; score: number} =>
        item.reason !== null,
    )
    .sort(
      (a, b) =>
        b.score - a.score ||
        b.track.createdAt - a.track.createdAt ||
        a.track.id.localeCompare(b.track.id),
    )
    .slice(0, limit)
    .map(({track, reason}) => ({track, reason}));
}
