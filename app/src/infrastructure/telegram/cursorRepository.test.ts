import {migrate} from '../database/migrations';
import {nodeTestDatabase} from '../../testing/nodeDatabase';
import {SqliteTelegramCursorStore} from './cursorRepository';

it('persists full Telegram message ids and resumes per chat', async () => {
  const database = nodeTestDatabase();
  await migrate(database);
  const store = new SqliteTelegramCursorStore(database);
  const chat = {id: '-1009876543210', kind: 'channels' as const, archived: true};
  expect(await store.read(chat.id)).toBeNull();
  await store.commit(chat, '9007199254740993001', '9007199254740993000');
  expect(await store.read(chat.id)).toEqual({
    newest: '9007199254740993001',
    backfill: '9007199254740993000',
  });
  await store.commit(chat, '9007199254740993002', null);
  expect(await store.read(chat.id)).toEqual({newest: '9007199254740993002', backfill: null});
  database.close();
});
