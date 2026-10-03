import {z} from 'zod';
import type {InspectedMedia, ManagedFilesystem} from '../../domain/import';
import {managedMediaNative, type ManagedMediaNativeV1} from '../../native/ManagedMedia';
import {AppError, errorCodes} from '../../shared/errors';
const inspectionSchema = z.object({
  path: z.string(),
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
  mimeType: z.string(),
  extension: z.enum(['mp3', 'flac', 'm4a', 'aac']),
  fileSize: z.number().int().positive(),
  title: z.string(),
  artist: z.string(),
  album: z.string(),
  genre: z.string(),
  durationMs: z.number().positive(),
  artworkPath: z.string().nullable(),
  embeddedLyrics: z.string().max(100_000).optional(),
});
export function aborted(): Error {
  const error = new Error('Cancelled');
  error.name = 'AbortError';
  return error;
}
export class NativeManagedFilesystem implements ManagedFilesystem {
  constructor(private readonly bridge: ManagedMediaNativeV1 = managedMediaNative()) {}
  private async cancellable<T>(
    signal: AbortSignal,
    work: (id: string) => Promise<T>,
    cleanup?: (result: T) => Promise<void>,
  ): Promise<T> {
    if (signal.aborted) {
      throw aborted();
    }
    const id = await this.bridge.createId();
    if (signal.aborted) {
      throw aborted();
    }
    const cancel = () => this.bridge.cancel(id);
    signal.addEventListener('abort', cancel, {once: true});
    try {
      const result = await work(id);
      if (signal.aborted) {
        if (cleanup) {
          await cleanup(result);
        }
        throw aborted();
      }
      return result;
    } catch (error) {
      if (signal.aborted) {
        throw aborted();
      }
      const code = z.object({code: z.enum(errorCodes)}).safeParse(error);
      throw new AppError(code.success ? code.data.code : 'IMPORT_CORRUPT_FILE');
    } finally {
      signal.removeEventListener('abort', cancel);
    }
  }
  stage(uri: string, maxBytes: number, signal: AbortSignal): Promise<string> {
    return this.cancellable(
      signal,
      id => this.bridge.stage(id, uri, maxBytes),
      path => this.bridge.remove(path),
    );
  }
  async inspect(path: string, signal: AbortSignal): Promise<InspectedMedia> {
    return inspectionSchema.parse(
      JSON.parse(await this.cancellable(signal, id => this.bridge.inspect(id, path))),
    );
  }
  promote(path: string, hash: string, extension: string): Promise<string> {
    return this.bridge.promote(path, hash, extension);
  }
  remove(path: string): Promise<void> {
    return this.bridge.remove(path);
  }
  reconcile(ownedPaths: string[]): Promise<void> {
    return this.bridge.reconcile(JSON.stringify(ownedPaths));
  }
  freeBytes(): Promise<number> {
    return this.bridge.freeBytes();
  }
}
