import {
  trackSchema,
  type BrowseDimension,
  type Collection,
  type LibraryQuery,
  type Track,
  type TrackRepository,
  type TrackSource,
  type Language,
} from '../../domain/track';
import {normalizeSearch} from '../../domain/track/normalize';
import type {Database, DatabaseSession, SqlRow, SqlValue} from './contracts';

const selectTrack = `SELECT t.*, COALESCE(a.title,'') AS album,
  COALESCE((SELECT GROUP_CONCAT(ar.name, ', ') FROM track_artists ta JOIN artists ar ON ar.id=ta.artist_id WHERE ta.track_id=t.id),'') AS artist,
  COALESCE((SELECT GROUP_CONCAT(g.name, ', ') FROM track_genres tg JOIN genres g ON g.id=tg.genre_id WHERE tg.track_id=t.id),'') AS genre,
  EXISTS(SELECT 1 FROM favorites f WHERE f.track_id=t.id) AS favorite
  FROM tracks t LEFT JOIN albums a ON a.id=t.album_id`;
export function mapTrack(row: SqlRow): Track {
  return trackSchema.parse({
    id: row.id,
    title: row.title,
    normalizedTitle: row.normalized_title,
    artist: row.artist,
    album: row.album,
    genre: row.genre,
    canonicalUri: row.canonical_uri,
    managedPath: row.managed_path,
    contentHash: row.content_hash,
    durationMs: row.duration_ms,
    fileSize: row.file_size,
    mimeType: row.mime_type,
    extension: row.extension,
    artworkPath: row.artwork_path,
    language: row.language_code,
    languageConfidence: row.language_confidence,
    favorite: Boolean(row.favorite),
    createdAt: row.created_at,
  });
}
function queryWhere(query: LibraryQuery): {sql: string; params: SqlValue[]} {
  const conditions: string[] = [];
  const params: SqlValue[] = [];
  if (query.search?.trim()) {
    const pattern = `%${normalizeSearch(query.search).replace(/[\\%_]/g, '\\$&')}%`;
    // Resolve matching identities once per dimension instead of running seven
    // correlated lookups for every track in a large library.
    conditions.push(`t.id IN (
      SELECT id FROM tracks WHERE normalized_title LIKE ? ESCAPE '\\'
      UNION SELECT ta.track_id FROM artists ar JOIN track_artists ta ON ta.artist_id=ar.id WHERE ar.normalized_name LIKE ? ESCAPE '\\'
      UNION SELECT tr.id FROM albums al JOIN tracks tr ON tr.album_id=al.id WHERE al.normalized_title LIKE ? ESCAPE '\\'
      UNION SELECT tg.track_id FROM genres g JOIN track_genres tg ON tg.genre_id=g.id WHERE g.name LIKE ? ESCAPE '\\'
      UNION SELECT s.track_id FROM track_sources s WHERE s.original_filename LIKE ? ESCAPE '\\' OR s.source_type LIKE ? ESCAPE '\\'
      UNION SELECT id FROM tracks WHERE language_code LIKE ? ESCAPE '\\'
      UNION SELECT pt.track_id FROM playlists p JOIN playlist_tracks pt ON pt.playlist_id=p.id WHERE p.name LIKE ? ESCAPE '\\'
    )`);
    params.push(...Array<SqlValue>(8).fill(pattern));
  }
  if (query.language) {
    conditions.push('t.language_code=?');
    params.push(query.language);
  }
  if (query.dimension === 'favorites') {
    conditions.push('EXISTS(SELECT 1 FROM favorites f WHERE f.track_id=t.id)');
  }
  if (query.dimension === 'telegram') {
    conditions.push(
      "EXISTS(SELECT 1 FROM track_sources s WHERE s.track_id=t.id AND s.source_type='telegram')",
    );
  }
  if (query.dimension === 'played' || query.dimension === 'mostPlayed') {
    conditions.push('EXISTS(SELECT 1 FROM play_history h WHERE h.track_id=t.id)');
  }
  if (query.value) {
    const filters: Partial<Record<BrowseDimension, string>> = {
      artists: 'EXISTS(SELECT 1 FROM track_artists ta WHERE ta.track_id=t.id AND ta.artist_id=?)',
      albums: 't.album_id=?',
      genres: 'EXISTS(SELECT 1 FROM track_genres tg WHERE tg.track_id=t.id AND tg.genre_id=?)',
      sources: 'EXISTS(SELECT 1 FROM track_sources s WHERE s.track_id=t.id AND s.source_type=?)',
      languages: 't.language_code=?',
    };
    const filter = query.dimension && filters[query.dimension];
    if (filter) {
      conditions.push(filter);
      params.push(query.value);
    }
  }
  return {
    sql: conditions.length ? ` WHERE ${conditions.join(' AND ')}` : '',
    params,
  };
}
export class SqliteTrackRepository implements TrackRepository {
  constructor(private readonly database: Database) {}
  async list(query: LibraryQuery = {}): Promise<Track[]> {
    const where = queryWhere(query);
    const order =
      query.dimension === 'mostPlayed'
        ? '(SELECT COUNT(*) FROM play_history h WHERE h.track_id=t.id) DESC'
        : query.dimension === 'played'
          ? '(SELECT MAX(played_at) FROM play_history h WHERE h.track_id=t.id) DESC'
          : query.sort === 'recent' || query.dimension === 'recent'
            ? 't.created_at DESC'
            : query.sort === 'artist'
              ? 'artist COLLATE NOCASE'
              : 't.normalized_title';
    const result = await this.database.execute(
      `${selectTrack}${where.sql} ORDER BY ${order},t.id LIMIT ? OFFSET ?`,
      [
        ...where.params,
        Math.max(1, Math.min(query.limit ?? 60, 200)),
        Math.max(0, query.offset ?? 0),
      ],
    );
    return result.rows.map(mapTrack);
  }
  async count(): Promise<number> {
    const result = await this.database.execute('SELECT COUNT(*) AS count FROM tracks');
    return Number(result.rows[0]?.count ?? 0);
  }
  async get(id: string): Promise<Track | null> {
    const result = await this.database.execute(`${selectTrack} WHERE t.id=?`, [id]);
    return result.rows[0] ? mapTrack(result.rows[0]) : null;
  }
  async findByHash(hash: string): Promise<Track | null> {
    const result = await this.database.execute(`${selectTrack} WHERE t.content_hash=?`, [hash]);
    return result.rows[0] ? mapTrack(result.rows[0]) : null;
  }
  async firstPlayable(favoritesOnly = false): Promise<Track | null> {
    const result = await this.database.execute(
      `${selectTrack} WHERE t.managed_path IS NOT NULL${favoritesOnly ? ' AND EXISTS (SELECT 1 FROM favorites f WHERE f.track_id=t.id)' : ''} ORDER BY t.created_at DESC,t.id LIMIT 1`,
    );
    return result.rows[0] ? mapTrack(result.rows[0]) : null;
  }
  async relatedCandidates(anchor: Track, limit = 200): Promise<Track[]> {
    const artist = normalizeSearch(anchor.artist);
    const album = normalizeSearch(anchor.album);
    const genre = anchor.genre.trim();
    if (!artist && !album && !genre) return [];
    const result = await this.database.execute(
      `${selectTrack} WHERE t.id<>? AND t.managed_path IS NOT NULL AND (
        (?<>'' AND EXISTS (SELECT 1 FROM track_artists ta JOIN artists ar ON ar.id=ta.artist_id WHERE ta.track_id=t.id AND ar.normalized_name=?))
        OR (?<>'' AND a.normalized_title=?)
        OR (?<>'' AND EXISTS (SELECT 1 FROM track_genres tg JOIN genres g ON g.id=tg.genre_id WHERE tg.track_id=t.id AND g.name=? COLLATE NOCASE))
      ) ORDER BY t.created_at DESC,t.id LIMIT ?`,
      [anchor.id, artist, artist, album, album, genre, genre, Math.max(1, Math.min(limit, 200))],
    );
    return result.rows.map(mapTrack);
  }
  async collections(dimension: BrowseDimension): Promise<Collection[]> {
    const queries: Partial<Record<BrowseDimension, string>> = {
      artists:
        'SELECT a.id,a.name AS title,COUNT(*) AS count FROM artists a JOIN track_artists t ON t.artist_id=a.id GROUP BY a.id',
      albums:
        'SELECT a.id,a.title,COUNT(*) AS count FROM albums a JOIN tracks t ON t.album_id=a.id GROUP BY a.id',
      genres:
        'SELECT g.id,g.name AS title,COUNT(*) AS count FROM genres g JOIN track_genres t ON t.genre_id=g.id GROUP BY g.id',
      sources:
        'SELECT source_type AS id,source_type AS title,COUNT(DISTINCT track_id) AS count FROM track_sources GROUP BY source_type',
      languages:
        'SELECT language_code AS id,language_code AS title,COUNT(*) AS count FROM tracks GROUP BY language_code',
    };
    const sql = queries[dimension];
    if (!sql) {
      return [];
    }
    const result = await this.database.execute(`${sql} ORDER BY title COLLATE NOCASE`);
    return result.rows.map(row => ({
      id: String(row.id),
      title: String(row.title),
      count: Number(row.count),
    }));
  }
  async save(input: Track, source: TrackSource): Promise<void> {
    const track = trackSchema.parse(input);
    await this.database.transaction(async session => {
      const albumId = `album:${normalizeSearch(track.album)}`;
      await session.execute('INSERT OR IGNORE INTO albums VALUES (?,?,?)', [
        albumId,
        track.album,
        normalizeSearch(track.album),
      ]);
      await session.execute(
        `INSERT INTO tracks (id,content_hash,canonical_uri,managed_path,title,normalized_title,album_id,duration_ms,mime_type,extension,file_size,artwork_path,language_code,language_confidence,created_at,updated_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
          track.id,
          track.contentHash,
          track.canonicalUri,
          track.managedPath,
          track.title,
          track.normalizedTitle,
          albumId,
          track.durationMs,
          track.mimeType,
          track.extension,
          track.fileSize,
          track.artworkPath,
          track.language,
          track.languageConfidence,
          track.createdAt,
          track.createdAt,
        ],
      );
      const artistId = `artist:${normalizeSearch(track.artist)}`;
      await session.execute('INSERT OR IGNORE INTO artists VALUES (?,?,?)', [
        artistId,
        track.artist,
        normalizeSearch(track.artist),
      ]);
      await session.execute('INSERT INTO track_artists VALUES (?,?)', [track.id, artistId]);
      if (track.genre) {
        const genreId = `genre:${normalizeSearch(track.genre)}`;
        await session.execute('INSERT OR IGNORE INTO genres VALUES (?,?)', [genreId, track.genre]);
        await session.execute('INSERT INTO track_genres VALUES (?,?)', [track.id, genreId]);
      }
      await this.saveSource(session, track.id, source);
      if (track.favorite) {
        await session.execute('INSERT INTO favorites VALUES (?,?)', [track.id, Date.now()]);
      }
    });
  }
  private async saveSource(
    session: DatabaseSession,
    id: string,
    source: TrackSource,
  ): Promise<void> {
    await session.execute(
      `INSERT OR IGNORE INTO track_sources (track_id,source_type,original_filename,telegram_chat_id,telegram_message_id,provider_id,provider_item_id,source_url,author,license,license_url) VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [
        id,
        source.type,
        source.originalFilename,
        source.chatId ?? null,
        source.messageId ?? null,
        source.providerId ?? null,
        source.providerItemId ?? null,
        source.sourceUrl ?? null,
        source.author ?? null,
        source.license ?? null,
        source.licenseUrl ?? null,
      ],
    );
  }
  async addSource(id: string, source: TrackSource): Promise<void> {
    await this.saveSource(this.database, id, source);
  }
  async setFavorite(id: string, favorite: boolean): Promise<void> {
    await this.database.execute(
      favorite
        ? 'INSERT OR IGNORE INTO favorites VALUES (?,?)'
        : 'DELETE FROM favorites WHERE track_id=?',
      favorite ? [id, Date.now()] : [id],
    );
  }
  async setLanguage(id: string, language: Language): Promise<void> {
    await this.database.execute(
      'UPDATE tracks SET language_code=?,language_confidence=1,language_corrected=1,updated_at=? WHERE id=?',
      [language, Date.now(), id],
    );
  }
}
export {selectTrack};
