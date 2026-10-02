import {SqliteImportJournal} from './importJournal';
import {migrate} from './migrations';
import {SqliteTrackRepository} from './trackRepository';
import {nodeTestDatabase} from '../../testing/nodeDatabase';
import {fixtureTrack} from '../../testing/fixtures';
import type {ManagedFilesystem} from '../../domain/import';

it('recovers interrupted imports while preserving only committed media ownership', async () => {
  const db = nodeTestDatabase();
  try {
    await migrate(db);
    const journal = new SqliteImportJournal(db);
    const source = {type: 'manual_import', originalFilename: 'song.mp3'} as const;
    const track = {
      ...fixtureTrack(1),
      contentHash: 'a'.repeat(64),
      managedPath: 'file:///media/audio/a.mp3',
      artworkPath: 'file:///media/artwork/a.jpg',
    };
    await journal.begin('committed', source);
    await journal.inspected('committed', 'file:///media/temp/a.part', track.contentHash);
    await new SqliteTrackRepository(db).save(track, source);
    await journal.begin('orphan', source);
    await journal.inspected('orphan', 'file:///media/temp/b.part', 'b'.repeat(64));
    await journal.begin('staging', source);
    const reconcile = jest.fn().mockResolvedValue(undefined);
    const files = {reconcile} as unknown as ManagedFilesystem;
    await journal.recover(files);
    expect(reconcile).toHaveBeenCalledWith([track.managedPath, track.artworkPath]);
    expect(
      (
        await db.execute(
          'SELECT id,state,track_id,error_code,temp_path FROM import_items ORDER BY id',
        )
      ).rows,
    ).toEqual([
      {id: 'committed', state: 'done', track_id: track.id, error_code: null, temp_path: null},
      {
        id: 'orphan',
        state: 'failed',
        track_id: null,
        error_code: 'IMPORT_INTERRUPTED',
        temp_path: null,
      },
      {
        id: 'staging',
        state: 'failed',
        track_id: null,
        error_code: 'IMPORT_INTERRUPTED',
        temp_path: null,
      },
    ]);
    await journal.recover(files);
    expect(await new SqliteTrackRepository(db).count()).toBe(1);
  } finally {
    db.close();
  }
});

it('does not erase the pending journal when native reconciliation fails', async () => {
  const db = nodeTestDatabase();
  try {
    await migrate(db);
    const journal = new SqliteImportJournal(db);
    await journal.begin('pending', {type: 'manual_import', originalFilename: 'song.mp3'});
    await expect(
      journal.recover({
        reconcile: async () => {
          throw new Error('Disk unavailable');
        },
      } as unknown as ManagedFilesystem),
    ).rejects.toThrow('Disk unavailable');
    expect((await db.execute('SELECT state FROM import_items')).rows[0]?.state).toBe('validating');
  } finally {
    db.close();
  }
});
