import {migrate} from './migrations';
import {SqliteTrackRepository} from './trackRepository';
import {SqlitePlaylistRepository} from './playlistRepository';
import {nodeTestDatabase} from '../../testing/nodeDatabase';
import {fixtureTrack} from '../../testing/fixtures';
import type {Database} from './contracts';
describe('SQLite integration', () => {
  let db: Database;
  let tracks: SqliteTrackRepository;
  let playlists: SqlitePlaylistRepository;
  beforeEach(async () => {
    db = nodeTestDatabase();
    await migrate(db);
    tracks = new SqliteTrackRepository(db);
    playlists = new SqlitePlaylistRepository(db);
  });
  afterEach(() => db.close());
  it('migrates idempotently and creates every required table', async () => {
    await migrate(db);
    const result = await db.execute("SELECT name FROM sqlite_master WHERE type='table'");
    expect(result.rows).toHaveLength(21);
    expect((await db.execute('SELECT version FROM schema_migrations')).rows).toHaveLength(2);
  });
  it('rolls back a failed migration and rejects a newer schema', async () => {
    await db.execute('INSERT INTO schema_migrations VALUES (99,0)');
    await expect(migrate(db)).rejects.toThrow('DATABASE_ERROR');
  });
  it('preserves normalized metadata, favorites and user language corrections', async () => {
    const track = fixtureTrack(1);
    await tracks.save(track, {
      type: 'manual_import',
      originalFilename: 'demo.mp3',
    });
    await tracks.setFavorite(track.id, true);
    await tracks.setLanguage(track.id, 'fa');
    expect((await tracks.list({dimension: 'favorites'}))[0]).toMatchObject({
      id: track.id,
      favorite: true,
      language: 'fa',
    });
    expect(await tracks.list({search: 'demo artist 1'})).toHaveLength(1);
    expect(await tracks.list({search: '%'})).toHaveLength(0);
    expect(await tracks.list({search: 'demo.mp3'})).toHaveLength(1);
  });
  it('enforces one physical hash and preserves multiple provenance records', async () => {
    const track = {...fixtureTrack(2), contentHash: 'a'.repeat(64)};
    await tracks.save(track, {
      type: 'telegram',
      originalFilename: 'song.mp3',
      chatId: '1',
      messageId: '2',
    });
    await expect(
      tracks.save(
        {...track, id: fixtureTrack(3).id},
        {type: 'manual_import', originalFilename: 'copy.mp3'},
      ),
    ).rejects.toThrow();
    expect(await tracks.count()).toBe(1);
    await tracks.addSource(track.id, {
      type: 'telegram',
      originalFilename: 'copy.mp3',
      chatId: '3',
      messageId: '4',
    });
    expect((await db.execute('SELECT * FROM track_sources')).rows).toHaveLength(2);
    expect((await tracks.findByHash('a'.repeat(64)))?.id).toBe(track.id);
  });
  it('searches every metadata dimension and follows playlist membership changes', async () => {
    const track = fixtureTrack(1);
    await tracks.save(track, {type: 'manual_import', originalFilename: '100%_mix.mp3'});
    await tracks.save(fixtureTrack(2), {type: 'fixture', originalFilename: 'other.mp3'});
    await playlists.create('evening', 'Evening collection');
    await playlists.addTrack('evening', track.id);
    for (const search of [
      track.title,
      track.artist,
      track.album,
      track.genre,
      '100%_',
      'manual_import',
      'en',
      'Evening collection',
    ]) {
      expect((await tracks.list({search})).map(item => item.id)).toEqual([track.id]);
    }
    await playlists.rename('evening', 'Quiet collection');
    expect(await tracks.list({search: 'Evening collection'})).toHaveLength(0);
    expect((await tracks.list({search: 'Quiet collection'}))[0]?.id).toBe(track.id);
    await playlists.removeTrack('evening', track.id);
    expect(await tracks.list({search: 'Quiet collection'})).toHaveLength(0);
  });
  it('creates, renames and deletes playlists without deleting songs', async () => {
    const track = fixtureTrack(1);
    await tracks.save(track, {
      type: 'manual_import',
      originalFilename: 'demo.mp3',
    });
    await playlists.create('test', 'Evening');
    await playlists.addTrack('test', track.id);
    await playlists.addTrack('test', track.id);
    expect(await playlists.tracks('test')).toHaveLength(1);
    await playlists.rename('test', 'Quiet');
    expect((await playlists.list())[0]?.name).toBe('Quiet');
    await playlists.removeTrack('test', track.id);
    expect(await playlists.tracks('test')).toHaveLength(0);
    await playlists.delete('test');
    expect(await tracks.count()).toBe(1);
    expect(await playlists.list()).toHaveLength(0);
  });
  it('rolls back partial writes and respects dimension filters', async () => {
    const track = fixtureTrack(5);
    await tracks.save(track, {type: 'local', originalFilename: 'one.mp3'});
    await expect(
      tracks.save(track, {type: 'local', originalFilename: 'two.mp3'}),
    ).rejects.toThrow();
    expect(await tracks.count()).toBe(1);
    expect(await tracks.list({dimension: 'sources', value: 'local'})).toHaveLength(1);
    expect(await tracks.list({dimension: 'sources', value: 'telegram'})).toHaveLength(0);
    expect((await tracks.collections('artists'))[0]?.count).toBe(1);
  });
});
