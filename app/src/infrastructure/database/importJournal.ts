import type {Database} from './contracts';
import type {ImportJournal, ManagedFilesystem} from '../../domain/import';
import type {TrackSource} from '../../domain/track';

/** Journal precedes file promotion; boot recovery uses committed track ownership. */
export class SqliteImportJournal implements ImportJournal {
  constructor(private readonly database: Database) {}
  async begin(id: string, source: TrackSource): Promise<void> {
    const now = Date.now();
    await this.database.transaction(async session => {
      await session.execute('INSERT INTO imports VALUES (?,?,?,?,?)', [
        id,
        source.type,
        'importing',
        now,
        now,
      ]);
      await session.execute(
        'INSERT INTO import_items (id,import_id,state,updated_at) VALUES (?,?,?,?)',
        [id, id, 'validating', now],
      );
    });
  }
  async inspected(id: string, path: string, hash: string): Promise<void> {
    await this.database.execute(
      'UPDATE import_items SET temp_path=?,content_hash=?,state=?,updated_at=? WHERE id=?',
      [path, hash, 'importing', Date.now(), id],
    );
  }
  async finish(id: string, trackId: string | null, errorCode: string | null): Promise<void> {
    const state = trackId ? 'done' : errorCode === 'CANCELLED' ? 'cancelled' : 'failed';
    await this.database.transaction(async session => {
      await session.execute(
        'UPDATE import_items SET state=?,track_id=?,temp_path=NULL,error_code=?,updated_at=? WHERE id=?',
        [state, trackId, errorCode, Date.now(), id],
      );
      await session.execute('UPDATE imports SET state=?,updated_at=? WHERE id=?', [
        state,
        Date.now(),
        id,
      ]);
    });
  }
  async recover(files: ManagedFilesystem): Promise<void> {
    // Run before constructing the importer. Never reconcile concurrently with imports.
    const owned = await this.database.execute(
      'SELECT managed_path,artwork_path FROM tracks WHERE managed_path IS NOT NULL OR artwork_path IS NOT NULL',
    );
    const paths = owned.rows.flatMap(row =>
      [row.managed_path, row.artwork_path].filter(
        (path): path is string => typeof path === 'string',
      ),
    );
    await files.reconcile(paths);
    const pending = await this.database.execute(
      "SELECT id,content_hash FROM import_items WHERE state IN ('validating','importing')",
    );
    for (const item of pending.rows) {
      const committed = item.content_hash
        ? await this.database.execute('SELECT id FROM tracks WHERE content_hash=?', [
            item.content_hash,
          ])
        : {rows: []};
      const trackId = committed.rows[0]?.id;
      await this.finish(
        String(item.id),
        typeof trackId === 'string' ? trackId : null,
        trackId ? null : 'IMPORT_INTERRUPTED',
      );
    }
  }
}
