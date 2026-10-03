import {z} from 'zod';

export const languageSchema = z.enum(['fa', 'en', 'ar', 'es', 'de', 'it', 'other']);
export type Language = z.infer<typeof languageSchema>;
export const trackSchema = z.object({
  id: z.uuid(),
  title: z.string().min(1),
  normalizedTitle: z.string(),
  artist: z.string(),
  album: z.string(),
  genre: z.string(),
  canonicalUri: z.string(),
  managedPath: z.string().nullable(),
  contentHash: z
    .string()
    .regex(/^[a-f0-9]{64}$/)
    .nullable(),
  durationMs: z.number().int().nonnegative(),
  fileSize: z.number().int().nonnegative(),
  mimeType: z.string(),
  extension: z.string(),
  artworkPath: z.string().nullable(),
  language: languageSchema,
  languageConfidence: z.number().min(0).max(1),
  favorite: z.boolean(),
  createdAt: z.number().int(),
});
export type Track = z.infer<typeof trackSchema>;
export type TrackIdentity = Pick<Track, 'title' | 'artist' | 'album' | 'durationMs'> & {
  musicBrainzId?: string;
  isrc?: string;
};
export type TrackSource = {
  type: 'telegram' | 'local' | 'app_download' | 'manual_import' | 'fixture';
  originalFilename: string;
  chatId?: string;
  messageId?: string;
};
export type BrowseDimension =
  | 'songs'
  | 'artists'
  | 'albums'
  | 'genres'
  | 'sources'
  | 'languages'
  | 'favorites'
  | 'recent'
  | 'played'
  | 'mostPlayed'
  | 'telegram';
export type LibraryQuery = {
  search?: string;
  dimension?: BrowseDimension;
  value?: string;
  language?: Language;
  sort?: 'title' | 'artist' | 'recent';
  offset?: number;
  limit?: number;
};
export type Collection = {id: string; title: string; count: number};
export interface TrackRepository {
  list(query?: LibraryQuery): Promise<Track[]>;
  count(): Promise<number>;
  collections(dimension: BrowseDimension): Promise<Collection[]>;
  get(id: string): Promise<Track | null>;
  findByHash(hash: string): Promise<Track | null>;
  firstPlayable(favoritesOnly?: boolean): Promise<Track | null>;
  relatedCandidates(anchor: Track, limit?: number): Promise<Track[]>;
  save(track: Track, source: TrackSource): Promise<void>;
  addSource(trackId: string, source: TrackSource): Promise<void>;
  setFavorite(id: string, favorite: boolean): Promise<void>;
  setLanguage(id: string, language: Language): Promise<void>;
}
