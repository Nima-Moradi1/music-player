import type {TelegramPolicy} from './policy';

export type ChatKind = 'savedMessages' | 'privateChats' | 'channels' | 'groups';
export type TelegramChat = {id: string; kind: ChatKind; archived: boolean};
export type TelegramFile = {id: string; name: string; mimeType: string; size: number};
export type TelegramMessage = {
  id: string;
  chatId: string;
  content: 'audio' | 'document' | 'voice' | 'video' | 'other';
  file?: TelegramFile;
};
export interface TelegramScanClient {
  listChats(folder: 'main' | 'archive', offset: number, limit: number): Promise<TelegramChat[]>;
  history(chatId: string, fromMessageId: string | null, limit: number): Promise<TelegramMessage[]>;
}
export interface TelegramCursorStore {
  read(chatId: string): Promise<string | null>;
  write(chat: TelegramChat, messageId: string): Promise<void>;
}
export type TelegramCandidate = TelegramMessage & {file: TelegramFile};

const audioExtension = /\.(mp3|flac|m4a|aac)$/i;
const audioMime = new Set(['audio/mpeg', 'audio/flac', 'audio/x-flac', 'audio/mp4', 'audio/aac']);

export function eligibleFile(
  message: TelegramMessage,
  policy: TelegramPolicy,
): message is TelegramCandidate {
  const file = message.file;
  if (!file || file.size <= 0 || file.size > policy.maxFileBytes) {
    return false;
  }
  if (message.content !== 'audio' && message.content !== 'document') {
    return false;
  }
  return audioExtension.test(file.name) && audioMime.has(file.mimeType.toLowerCase());
}

export async function scanTelegramHistory({
  client,
  cursors,
  policy,
  onCandidate,
  signal,
  maxPages = 100,
}: {
  client: TelegramScanClient;
  cursors: TelegramCursorStore;
  policy: TelegramPolicy;
  onCandidate: (message: TelegramCandidate) => Promise<void>;
  signal?: AbortSignal;
  maxPages?: number;
}): Promise<{chats: number; messages: number; candidates: number}> {
  const counts = {chats: 0, messages: 0, candidates: 0};
  if (!policy.consent || maxPages < 1 || maxPages > 1000) {
    return counts;
  }
  let pages = 0;
  for (const folder of ['main', 'archive'] as const) {
    for (let offset = 0; pages < maxPages; offset += 50) {
      if (signal?.aborted) return counts;
      const chats = await client.listChats(folder, offset, 50);
      pages++;
      for (const chat of chats) {
        if (signal?.aborted) return counts;
        if (!policy[chat.kind]) continue;
        counts.chats++;
        let from = await cursors.read(chat.id);
        while (pages < maxPages) {
          if (signal?.aborted) return counts;
          const messages = await client.history(chat.id, from, 50);
          pages++;
          if (messages.length === 0) break;
          for (const message of messages) {
            if (signal?.aborted) return counts;
            if (message.chatId !== chat.id || !message.id) continue;
            if (eligibleFile(message, policy)) {
              await onCandidate(message);
              counts.candidates++;
            }
            await cursors.write(chat, message.id);
            from = message.id;
            counts.messages++;
          }
          if (messages.length < 50) break;
        }
      }
      if (chats.length < 50) break;
    }
  }
  return counts;
}
