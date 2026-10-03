import type {MediaImporter} from '../import';
import type {TelegramPolicy} from './policy';
import {eligibleFile, type TelegramCandidate} from './scanner';

/** The adapter owns the downloaded temporary file and removes it after import. */
export interface TelegramFileTransfer {
  downloadToTemporaryFile(
    fileId: string,
    signal: AbortSignal,
    onProgress?: (progress: number) => void,
  ): Promise<string>;
  removeTemporaryFile(uri: string): Promise<void>;
  freeBytes(): Promise<number>;
  telegramStoredBytes(): Promise<number>;
  network(): Promise<'wifi' | 'cellular' | 'offline'>;
}

export type TelegramImportResult = {trackId: string; duplicate: boolean};

/** Called only after consent and authentication; scanner awaits this before cursor commit. */
export async function importTelegramCandidate({
  candidate,
  policy,
  transfer,
  importer,
  signal,
  onProgress,
}: {
  candidate: TelegramCandidate;
  policy: TelegramPolicy;
  transfer: TelegramFileTransfer;
  importer: MediaImporter;
  signal: AbortSignal;
  onProgress?: (progress: number) => void;
}): Promise<TelegramImportResult> {
  if (
    !policy.consent ||
    policy.paused ||
    (candidate.chatKind !== 'savedMessages' && candidate.chatKind !== 'privateChats') ||
    policy.excludedChatIds.includes(candidate.chatId) ||
    !eligibleFile(candidate, policy)
  ) {
    throw new Error('Telegram import is not permitted by policy');
  }
  if (signal.aborted) throw new Error('Cancelled');
  const network = await transfer.network();
  if (network === 'offline' || (policy.wifiOnly && network !== 'wifi')) {
    throw new Error('Telegram import is waiting for an allowed network');
  }
  const [free, stored] = await Promise.all([transfer.freeBytes(), transfer.telegramStoredBytes()]);
  // TDLib temp + managed staging may coexist until promotion.
  if (
    free < candidate.file.size * 2 + 2 * 1024 * 1024 ||
    stored + candidate.file.size > policy.maxStorageBytes
  ) {
    throw new Error('Telegram import storage limit reached');
  }
  let uri: string | null = null;
  try {
    uri = await transfer.downloadToTemporaryFile(candidate.file.id, signal, onProgress);
    if (signal.aborted) throw new Error('Cancelled');
    const result = await importer.import(
      uri,
      {
        type: 'telegram',
        originalFilename: candidate.file.name,
        chatId: candidate.chatId,
        messageId: candidate.id,
      },
      signal,
    );
    return {trackId: result.track.id, duplicate: result.duplicate};
  } finally {
    if (uri) await transfer.removeTemporaryFile(uri);
  }
}
