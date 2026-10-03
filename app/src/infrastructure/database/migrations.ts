import type {Database} from './contracts';
import {AppError} from '../../shared/errors';

export const migrations = [
  {
    version: 1,
    statements: [
      `CREATE TABLE artists (id TEXT PRIMARY KEY, name TEXT NOT NULL UNIQUE, normalized_name TEXT NOT NULL)`,
      `CREATE TABLE albums (id TEXT PRIMARY KEY, title TEXT NOT NULL, normalized_title TEXT NOT NULL, UNIQUE(title))`,
      `CREATE TABLE genres (id TEXT PRIMARY KEY, name TEXT NOT NULL UNIQUE)`,
      `CREATE TABLE tracks (
    id TEXT PRIMARY KEY, content_hash TEXT UNIQUE, canonical_uri TEXT NOT NULL,
    managed_path TEXT, title TEXT NOT NULL, normalized_title TEXT NOT NULL,
    album_id TEXT REFERENCES albums(id), duration_ms INTEGER NOT NULL CHECK(duration_ms >= 0),
    mime_type TEXT NOT NULL, extension TEXT NOT NULL, file_size INTEGER NOT NULL CHECK(file_size >= 0),
    bitrate INTEGER, sample_rate INTEGER, channels INTEGER, year INTEGER, disc_no INTEGER, track_no INTEGER,
    artwork_path TEXT, language_code TEXT NOT NULL DEFAULT 'other', language_confidence REAL NOT NULL DEFAULT 0,
    language_corrected INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL)`,
      `CREATE INDEX tracks_title ON tracks(normalized_title, id)`,
      `CREATE INDEX tracks_created ON tracks(created_at DESC, id)`,
      `CREATE INDEX tracks_language ON tracks(language_code, normalized_title)`,
      `CREATE INDEX tracks_album ON tracks(album_id)`,
      `CREATE TABLE track_artists (track_id TEXT REFERENCES tracks(id) ON DELETE CASCADE, artist_id TEXT REFERENCES artists(id), PRIMARY KEY(track_id,artist_id))`,
      `CREATE TABLE track_genres (track_id TEXT REFERENCES tracks(id) ON DELETE CASCADE, genre_id TEXT REFERENCES genres(id), PRIMARY KEY(track_id,genre_id))`,
      `CREATE TABLE playlists (id TEXT PRIMARY KEY, name TEXT NOT NULL CHECK(length(trim(name)) > 0), created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL)`,
      `CREATE TABLE playlist_tracks (playlist_id TEXT REFERENCES playlists(id) ON DELETE CASCADE, track_id TEXT REFERENCES tracks(id) ON DELETE CASCADE, position INTEGER NOT NULL, PRIMARY KEY(playlist_id,track_id), UNIQUE(playlist_id,position))`,
      `CREATE TABLE track_sources (id INTEGER PRIMARY KEY, track_id TEXT NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
    source_type TEXT NOT NULL, telegram_chat_id TEXT, telegram_message_id TEXT, telegram_sender_id TEXT,
    telegram_date INTEGER, telegram_source_kind TEXT, original_filename TEXT NOT NULL,
    UNIQUE(telegram_chat_id,telegram_message_id), UNIQUE(track_id,source_type,original_filename))`,
      `CREATE INDEX track_sources_type ON track_sources(source_type,track_id)`,
      `CREATE TABLE playback_progress (track_id TEXT PRIMARY KEY REFERENCES tracks(id) ON DELETE CASCADE, position_ms INTEGER NOT NULL, duration_ms INTEGER NOT NULL, completed INTEGER NOT NULL, updated_at INTEGER NOT NULL)`,
      `CREATE TABLE play_history (id INTEGER PRIMARY KEY, track_id TEXT REFERENCES tracks(id) ON DELETE CASCADE, played_at INTEGER NOT NULL, listened_ms INTEGER NOT NULL)`,
      `CREATE INDEX play_history_track ON play_history(track_id,played_at DESC)`,
      `CREATE TABLE favorites (track_id TEXT PRIMARY KEY REFERENCES tracks(id) ON DELETE CASCADE, created_at INTEGER NOT NULL)`,
      `CREATE TABLE lyrics (id TEXT PRIMARY KEY, track_id TEXT REFERENCES tracks(id) ON DELETE CASCADE, provider TEXT NOT NULL, text TEXT NOT NULL, offset_ms INTEGER NOT NULL DEFAULT 0, license TEXT NOT NULL, cached_at INTEGER NOT NULL)`,
      `CREATE TABLE lyrics_lines (lyrics_id TEXT REFERENCES lyrics(id) ON DELETE CASCADE, position INTEGER NOT NULL, at_ms INTEGER NOT NULL, text TEXT NOT NULL, PRIMARY KEY(lyrics_id,position))`,
      `CREATE TABLE imports (id TEXT PRIMARY KEY, source_type TEXT NOT NULL, state TEXT NOT NULL, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL)`,
      `CREATE TABLE import_items (id TEXT PRIMARY KEY, import_id TEXT REFERENCES imports(id) ON DELETE CASCADE, state TEXT NOT NULL, temp_path TEXT, track_id TEXT REFERENCES tracks(id), error_code TEXT, updated_at INTEGER NOT NULL)`,
      `CREATE TABLE telegram_chats (id TEXT PRIMARY KEY, kind TEXT NOT NULL, enabled INTEGER NOT NULL DEFAULT 0, archived INTEGER NOT NULL DEFAULT 0)`,
      `CREATE TABLE telegram_scan_cursors (chat_id TEXT PRIMARY KEY REFERENCES telegram_chats(id) ON DELETE CASCADE, message_id TEXT NOT NULL, updated_at INTEGER NOT NULL)`,
      `CREATE TABLE downloads (id TEXT PRIMARY KEY, provider TEXT NOT NULL, state TEXT NOT NULL, temp_path TEXT, progress REAL NOT NULL DEFAULT 0, updated_at INTEGER NOT NULL)`,
      `CREATE TABLE provider_cache (key TEXT PRIMARY KEY, provider TEXT NOT NULL, json TEXT NOT NULL, expires_at INTEGER NOT NULL)`,
    ],
  },
  {
    version: 2,
    statements: ['ALTER TABLE import_items ADD COLUMN content_hash TEXT'],
  },
  {
    version: 3,
    statements: ['ALTER TABLE telegram_scan_cursors ADD COLUMN backfill_message_id TEXT'],
  },
] as const;

export async function migrate(database: Database): Promise<void> {
  await database.execute('PRAGMA foreign_keys = ON');
  await database.execute('PRAGMA journal_mode = WAL');
  await database.execute(
    'CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY, applied_at INTEGER NOT NULL)',
  );
  await database.transaction(async session => {
    const result = await session.execute('SELECT version FROM schema_migrations ORDER BY version');
    const versions = new Set(result.rows.map(row => Number(row.version)));
    if ([...versions].some(version => version > migrations.length)) {
      throw new AppError('DATABASE_ERROR'); // A newer database must never be opened by an older app.
    }
    for (const migration of migrations) {
      if (versions.has(migration.version)) {
        continue;
      }
      for (const statement of migration.statements) {
        await session.execute(statement);
      }
      await session.execute('INSERT INTO schema_migrations VALUES (?,?)', [
        migration.version,
        Date.now(),
      ]);
    }
  });
}
