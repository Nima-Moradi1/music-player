import type {Database} from '../database/contracts';
import type {TelegramChat, TelegramCursorStore} from '../../domain/telegram/scanner';

export class SqliteTelegramCursorStore implements TelegramCursorStore {
  constructor(private readonly database: Database) {}

  async read(chatId: string): Promise<{newest: string; backfill: string | null} | null> {
    const result = await this.database.execute(
      'SELECT message_id,backfill_message_id FROM telegram_scan_cursors WHERE chat_id=?',
      [chatId],
    );
    const row = result.rows[0];
    return typeof row?.message_id === 'string'
      ? {
          newest: row.message_id,
          backfill: typeof row.backfill_message_id === 'string' ? row.backfill_message_id : null,
        }
      : null;
  }

  async commit(chat: TelegramChat, newest: string, backfill: string | null): Promise<void> {
    await this.database.transaction(async session => {
      await session.execute(
        'INSERT INTO telegram_chats (id,kind,enabled,archived) VALUES (?,?,1,?) ON CONFLICT(id) DO UPDATE SET kind=excluded.kind,archived=excluded.archived',
        [chat.id, chat.kind, chat.archived ? 1 : 0],
      );
      await session.execute(
        'INSERT INTO telegram_scan_cursors (chat_id,message_id,backfill_message_id,updated_at) VALUES (?,?,?,?) ON CONFLICT(chat_id) DO UPDATE SET message_id=excluded.message_id,backfill_message_id=excluded.backfill_message_id,updated_at=excluded.updated_at',
        [chat.id, newest, backfill, Date.now()],
      );
    });
  }
}
