import {nodeTestDatabase} from './nodeDatabase';
import {fixtureTrack} from './fixtures';
import {migrate} from '../infrastructure/database/migrations';
import {SqliteTrackRepository} from '../infrastructure/database/trackRepository';
it('queries a real 10,000-track SQLite fixture with bounded pages', async () => {
  const database = nodeTestDatabase();
  await migrate(database);
  const repository = new SqliteTrackRepository(database);
  try {
    const seedStart = performance.now();
    for (let i = 0; i < 10000; i++) {
      await repository.save(fixtureTrack(i), {type: 'fixture', originalFilename: `fixture-${i}`});
    }
    const seedMs = performance.now() - seedStart;
    const listStart = performance.now();
    expect(await repository.list()).toHaveLength(60);
    const listMs = performance.now() - listStart;
    const searchStart = performance.now();
    const result = await repository.list({search: 'demo artist 1499'});
    const searchMs = performance.now() - searchStart;
    expect(result.length).toBeGreaterThan(0);
    expect(await repository.count()).toBe(10000);
    console.info(
      JSON.stringify({benchmark: 'desktop-sqlite', tracks: 10000, seedMs, listMs, searchMs}),
    );
  } finally {
    database.close();
  }
}, 60000);
