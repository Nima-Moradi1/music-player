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
  read(chatId: string): Promise<{newest: string; backfill: string | null} | null>;
  commit(chat: TelegramChat, newest: string, backfill: string | null): Promise<void>;
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
  if (!policy.consent || policy.paused || maxPages < 1 || maxPages > 1000) {
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
        if (!policy[chat.kind] || policy.excludedChatIds.includes(chat.id)) continue;
        counts.chats++;
        const cursor = await cursors.read(chat.id);
        let newest = cursor?.newest ?? null;
        let from: string | null = null;
        let reachedNewest = false;
        let latestSeen: string | null = null;
        let initialBackfill: string | null = null;
        // Reconcile messages that arrived since the last scan before continuing
        // an older, paginated backfill. TDLib history is newest first.
        while (pages < maxPages) {
          if (signal?.aborted) return counts;
          const messages = await client.history(chat.id, from, 50);
          pages++;
          if (messages.length === 0) {
            reachedNewest = true;
            break;
          }
          const pageNewest = messages[0]?.id;
          latestSeen ??= pageNewest ?? null;
          let lastId: string | null = null;
          for (const message of messages) {
            if (signal?.aborted) return counts;
            if (message.chatId !== chat.id || !message.id) continue;
            if (message.id === newest) {
              reachedNewest = true;
              break;
            }
            if (eligibleFile(message, policy)) {
              await onCandidate(message);
              counts.candidates++;
            }
            lastId = message.id;
            counts.messages++;
          }
          if (!newest && pageNewest && lastId) {
            newest = pageNewest;
            initialBackfill = messages.length === 50 ? lastId : null;
            // Persist both positions together so a crash cannot skip older pages.
            await cursors.commit(chat, newest, initialBackfill);
            reachedNewest = true;
            break;
          }
          if (reachedNewest || messages.length < 50) {
            if (lastId && latestSeen && newest) {
              await cursors.commit(chat, latestSeen, cursor?.backfill ?? null);
              newest = latestSeen;
            }
            reachedNewest = true;
            break;
          }
          from = lastId;
          if (!from) break;
        }
        if (!reachedNewest || !newest) continue;
        // On a first scan, continue from the first committed page. On later
        // scans, the saved backfill position is independent of new messages.
        let backfill = cursor?.backfill ?? initialBackfill;
        while (backfill && pages < maxPages) {
          if (signal?.aborted) return counts;
          const messages = await client.history(chat.id, backfill, 50);
          pages++;
          let lastId: string | null = null;
          for (const message of messages) {
            if (signal?.aborted) return counts;
            if (message.chatId !== chat.id || !message.id) continue;
            if (eligibleFile(message, policy)) {
              await onCandidate(message);
              counts.candidates++;
            }
            lastId = message.id;
            counts.messages++;
          }
          backfill = messages.length === 50 ? lastId : null;
          await cursors.commit(chat, newest, backfill);
        }
      }
      if (chats.length < 50) break;
    }
  }
  return counts;
}
