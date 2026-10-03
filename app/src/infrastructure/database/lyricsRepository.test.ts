import {nodeTestDatabase} from '../../testing/nodeDatabase';
import {fixtureTrack} from '../../testing/fixtures';
import {migrate} from './migrations';
import {SqliteTrackRepository} from './trackRepository';
import {SqliteLyricsRepository} from './lyricsRepository';

it('stores local synced lyrics and offset without a network provider', async () => {
  const database = nodeTestDatabase();
  await migrate(database);
  const track = fixtureTrack(1);
  await new SqliteTrackRepository(database).save(track, {
    type: 'fixture',
    originalFilename: 'fixture',
  });
  const lyrics = new SqliteLyricsRepository(database);
  expect(await lyrics.getLocal(track.id)).toBeNull();
  await lyrics.saveEmbedded(track.id, '[00:01.00]Embedded');
  expect((await lyrics.getLocal(track.id))?.license).toBe('embedded-in-user-file');
  await lyrics.saveLocal(track.id, '[00:01.00]First\n[00:03.00]Second', 500);
  expect(await lyrics.getLocal(track.id)).toEqual({
    id: `manual:${track.id}`,
    text: '[00:01.00]First\n[00:03.00]Second',
    lines: [
      {atMs: 1000, text: 'First'},
      {atMs: 3000, text: 'Second'},
    ],
    offsetMs: 500,
    license: 'user-supplied',
  });
  await lyrics.saveLocal(track.id, 'Plain words', 0);
  expect((await lyrics.getLocal(track.id))?.lines).toEqual([]);
  database.close();
});
