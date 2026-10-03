import type {Track} from '../domain/track';
import {normalizeSearch} from '../domain/track/normalize';
export function fixtureTrack(index: number): Track {
  const languages = ['fa', 'en', 'ar', 'es', 'de', 'it', 'other'] as const;
  const language = languages[index % languages.length] ?? 'other';
  const title =
    language === 'fa' ? `آهنگ نمونه ${index}` : `Demo song ${String(index).padStart(5, '0')}`;
  return {
    id: `00000000-0000-4000-8000-${index.toString(16).padStart(12, '0')}`,
    title,
    normalizedTitle: normalizeSearch(title),
    artist: `Demo artist ${index % 1500}`,
    album: `Demo album ${index % 2000}`,
    genre: ['Ambient', 'Jazz', 'Pop', 'Electronic'][index % 4] ?? '',
    canonicalUri: `fixture://${index}`,
    managedPath: null,
    contentHash: null,
    durationMs: 180000,
    fileSize: 0,
    mimeType: 'audio/mpeg',
    extension: 'mp3',
    artworkPath: null,
    language,
    languageConfidence: 1,
    favorite: false,
    createdAt: 1700000000000 + index,
  };
}
