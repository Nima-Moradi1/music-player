import type {Track, TrackSource} from '../track';
import type {Unsubscribe} from '../../shared/errors';
export type ImportJobId = string;
export type TelegramAuthState =
  | 'waitTdlibParameters'
  | 'phone'
  | 'code'
  | 'password'
  | 'ready'
  | 'logging-out'
  | 'closed'
  | 'error';
export type TelegramScanOptions = {
  consent: true;
  savedMessages: boolean;
  privateChats: boolean;
  channels: boolean;
  groups: boolean;
  archive: boolean;
  documents: boolean;
  wifiOnly: boolean;
  maxFileSize: number;
  storageLimit: number;
  excludedChatIds: string[];
};
export type AutoImportConfig = TelegramScanOptions & {enabled: boolean};
export type ImportState =
  | 'queued'
  | 'downloading'
  | 'paused'
  | 'completed'
  | 'validating'
  | 'importing'
  | 'done'
  | 'failed'
  | 'cancelled'
  | 'duplicate';
export type TelegramImportListener = (event: {
  version: 1;
  jobId: ImportJobId;
  state: ImportState;
  progress: number;
}) => void;
export interface TelegramImportService {
  getAuthState(): Promise<TelegramAuthState>;
  submitPhone(phone: string): Promise<void>;
  submitCode(code: string): Promise<void>;
  submitPassword(password: string): Promise<void>;
  scan(options: TelegramScanOptions): Promise<ImportJobId>;
  pause(jobId: ImportJobId): Promise<void>;
  resume(jobId: ImportJobId): Promise<void>;
  cancel(jobId: ImportJobId): Promise<void>;
  setAutoImport(config: AutoImportConfig): Promise<void>;
  subscribe(listener: TelegramImportListener): Unsubscribe;
}
export type InspectedMedia = {
  path: string;
  sha256: string;
  mimeType: string;
  extension: string;
  fileSize: number;
  title: string;
  artist: string;
  album: string;
  genre: string;
  durationMs: number;
  artworkPath: string | null;
  embeddedLyrics?: string | undefined;
  metadataLanguage?: string;
};
export interface ManagedFilesystem {
  stage(uri: string, maxBytes: number, signal: AbortSignal): Promise<string>;
  inspect(path: string, signal: AbortSignal): Promise<InspectedMedia>;
  promote(path: string, hash: string, extension: string): Promise<string>;
  remove(path: string): Promise<void>;
  freeBytes(): Promise<number>;
  /** Cold boot only: delete temp and unreferenced managed files. */
  reconcile(ownedPaths: string[]): Promise<void>;
}
export interface MediaImporter {
  import(
    uri: string,
    source: TrackSource,
    signal: AbortSignal,
  ): Promise<{track: Track; duplicate: boolean}>;
}

export interface ImportJournal {
  begin(id: string, source: TrackSource): Promise<void>;
  inspected(id: string, path: string, hash: string): Promise<void>;
  finish(id: string, trackId: string | null, errorCode: string | null): Promise<void>;
}
