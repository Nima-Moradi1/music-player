import {migrate} from '../database/migrations';
import {nodeTestDatabase} from '../../testing/nodeDatabase';
import {SqliteTelegramCursorStore} from './cursorRepository';

it('persists full Telegram message ids and resumes per chat', async () => {
  const database = nodeTestDatabase();
  await migrate(database);
  const store = new SqliteTelegramCursorStore(database);
  const chat = {id: '-1009876543210', kind: 'channels' as const, archived: true};
  expect(await store.read(chat.id)).toBeNull();
  await store.write(chat, '9007199254740993001');
  expect(await store.read(chat.id)).toBe('9007199254740993001');
  await store.write(chat, '9007199254740993000');
  expect(await store.read(chat.id)).toBe('9007199254740993000');
  database.close();
});
