import type {Database} from '../database/contracts';
import type {TelegramChat, TelegramCursorStore} from '../../domain/telegram/scanner';

export class SqliteTelegramCursorStore implements TelegramCursorStore {
  constructor(private readonly database: Database) {}

  async read(chatId: string): Promise<string | null> {
    const result = await this.database.execute(
      'SELECT message_id FROM telegram_scan_cursors WHERE chat_id=?',
      [chatId],
    );
    return typeof result.rows[0]?.message_id === 'string' ? result.rows[0].message_id : null;
  }

  async write(chat: TelegramChat, messageId: string): Promise<void> {
    await this.database.transaction(async session => {
      await session.execute(
        'INSERT INTO telegram_chats (id,kind,enabled,archived) VALUES (?,?,1,?) ON CONFLICT(id) DO UPDATE SET kind=excluded.kind,archived=excluded.archived',
        [chat.id, chat.kind, chat.archived ? 1 : 0],
      );
      await session.execute(
        'INSERT INTO telegram_scan_cursors (chat_id,message_id,updated_at) VALUES (?,?,?) ON CONFLICT(chat_id) DO UPDATE SET message_id=excluded.message_id,updated_at=excluded.updated_at',
        [chat.id, messageId, Date.now()],
      );
    });
  }
}
