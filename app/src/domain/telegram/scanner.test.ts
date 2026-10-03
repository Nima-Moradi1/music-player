import {defaultTelegramPolicy} from './policy';
import {
  eligibleFile,
  scanTelegramHistory,
  type TelegramChat,
  type TelegramMessage,
} from './scanner';

const chat: TelegramChat = {id: '123', kind: 'savedMessages', archived: false};
const music: TelegramMessage = {
  id: '9007199254740993001',
  chatId: chat.id,
  content: 'audio',
  file: {id: 'f1', name: 'song.flac', mimeType: 'audio/flac', size: 100},
};

it('accepts supported audio but rejects voice, video, huge and misleading documents', () => {
  expect(eligibleFile(music, defaultTelegramPolicy)).toBe(true);
  expect(eligibleFile({...music, content: 'voice'}, defaultTelegramPolicy)).toBe(false);
  expect(eligibleFile({...music, content: 'video'}, defaultTelegramPolicy)).toBe(false);
  expect(
    eligibleFile({...music, file: {...music.file!, size: 1024 ** 3}}, defaultTelegramPolicy),
  ).toBe(false);
  expect(
    eligibleFile(
      {
        ...music,
        content: 'document',
        file: {...music.file!, name: 'song.mp3', mimeType: 'application/pdf'},
      },
      defaultTelegramPolicy,
    ),
  ).toBe(false);
  expect(
    eligibleFile(
      {...music, content: 'document', file: {...music.file!, mimeType: 'application/octet-stream'}},
      defaultTelegramPolicy,
    ),
  ).toBe(true);
});

it('requires consent, scans both folders, and stores the full message id only after processing', async () => {
  const events: string[] = [];
  const client = {
    listChats: jest.fn(async (folder: 'main' | 'archive') => (folder === 'main' ? [chat] : [])),
    history: jest.fn(async () => [music]),
  };
  const cursors = {
    read: jest.fn(async () => null),
    commit: jest.fn(async (_chat, id: string) => {
      events.push(`cursor:${id}`);
    }),
  };
  const onCandidate = jest.fn(async () => {
    events.push('import');
  });
  expect(
    await scanTelegramHistory({client, cursors, policy: defaultTelegramPolicy, onCandidate}),
  ).toEqual({chats: 0, messages: 0, candidates: 0});
  const result = await scanTelegramHistory({
    client,
    cursors,
    policy: {...defaultTelegramPolicy, consent: true},
    onCandidate,
  });
  expect(result).toEqual({chats: 1, messages: 1, candidates: 1});
  expect(client.listChats).toHaveBeenCalledWith('archive', 0, 50);
  expect(events).toEqual(['import', `cursor:${music.id}`]);
});

it('resumes older pages and imports newly arrived messages without replaying the cursor', async () => {
  const messages = Array.from({length: 51}, (_, index) => ({
    ...music,
    id: String(100 - index),
  }));
  let cursor: {newest: string; backfill: string | null} | null = null;
  const imported: string[] = [];
  const client = {
    listChats: async (folder: 'main' | 'archive') => (folder === 'main' ? [chat] : []),
    history: async (_chatId: string, from: string | null, limit: number) => {
      const start = from ? messages.findIndex(message => message.id === from) + 1 : 0;
      return messages.slice(start, start + limit);
    },
  };
  const cursors = {
    read: async () => cursor,
    commit: async (_chat: TelegramChat, newest: string, backfill: string | null) => {
      cursor = {newest, backfill};
    },
  };
  const args = {
    client,
    cursors,
    policy: {...defaultTelegramPolicy, consent: true},
    onCandidate: async (message: TelegramMessage) => {
      imported.push(message.id);
    },
  };
  await scanTelegramHistory(args);
  expect(imported).toHaveLength(51);
  expect(cursor).toEqual({newest: '100', backfill: null});
  messages.unshift({...music, id: '101'});
  await scanTelegramHistory(args);
  expect(imported).toHaveLength(52);
  expect(imported.at(-1)).toBe('101');
  expect(cursor).toEqual({newest: '101', backfill: null});
});

it('retries a transient listing failure before advancing a cursor', async () => {
  const client = {
    listChats: jest
      .fn()
      .mockRejectedValueOnce({transient: true, retryAfterMs: 0})
      .mockResolvedValueOnce([chat])
      .mockResolvedValueOnce([]),
    history: jest.fn(async () => [music]),
  };
  const cursors = {read: jest.fn(async () => null), commit: jest.fn(async () => undefined)};
  await scanTelegramHistory({
    client,
    cursors,
    policy: {...defaultTelegramPolicy, consent: true},
    onCandidate: async () => undefined,
  });
  expect(client.listChats).toHaveBeenCalledTimes(3);
  expect(cursors.commit).toHaveBeenCalledWith(chat, music.id, null);
});
