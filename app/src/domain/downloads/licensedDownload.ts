import type {MediaImporter} from '../import';

export type LicensedOffer = {
  providerId: string;
  itemId: string;
  filename: string;
  sizeBytes: number;
  offlineCopyAllowed: boolean;
  license: string;
};

export interface LicensedDownloadProvider {
  readonly id: string;
  /** Resolve immediately before transfer; signed URLs must never be persisted. */
  resolve(
    itemId: string,
    signal: AbortSignal,
  ): Promise<{
    url: string;
    expiresAt: number;
    offlineCopyAllowed: boolean;
  }>;
}

export interface LicensedDownloadTransfer {
  downloadToTemporaryFile(
    url: string,
    maxBytes: number,
    signal: AbortSignal,
    onProgress?: (progress: number) => void,
  ): Promise<string>;
  removeTemporaryFile(uri: string): Promise<void>;
  freeBytes(): Promise<number>;
}

/** Disabled until a reviewed provider and native transfer adapter are supplied. */
export async function importLicensedDownload({
  offer,
  provider,
  transfer,
  importer,
  maxBytes,
  signal,
  onProgress,
}: {
  offer: LicensedOffer;
  provider: LicensedDownloadProvider;
  transfer: LicensedDownloadTransfer;
  importer: MediaImporter;
  maxBytes: number;
  signal: AbortSignal;
  onProgress?: (progress: number) => void;
}) {
  if (
    provider.id !== offer.providerId ||
    !offer.offlineCopyAllowed ||
    !offer.license.trim() ||
    !Number.isSafeInteger(offer.sizeBytes) ||
    offer.sizeBytes <= 0 ||
    offer.sizeBytes > maxBytes
  ) {
    throw new Error('Licensed download unavailable');
  }
  if (signal.aborted) throw new Error('Cancelled');
  const resolved = await provider.resolve(offer.itemId, signal);
  let url: URL;
  try {
    url = new URL(resolved.url);
  } catch {
    throw new Error('Licensed download URL unavailable');
  }
  if (
    !resolved.offlineCopyAllowed ||
    !Number.isFinite(resolved.expiresAt) ||
    resolved.expiresAt <= Date.now() + 30_000 ||
    url.protocol !== 'https:' ||
    !url.hostname
  ) {
    throw new Error('Licensed download URL unavailable');
  }
  if ((await transfer.freeBytes()) < offer.sizeBytes * 2 + 2 * 1024 * 1024) {
    throw new Error('Insufficient download storage');
  }
  let uri: string | null = null;
  try {
    uri = await transfer.downloadToTemporaryFile(resolved.url, maxBytes, signal, onProgress);
    if (signal.aborted) throw new Error('Cancelled');
    const result = await importer.import(
      uri,
      {type: 'app_download', originalFilename: offer.filename},
      signal,
    );
    return {trackId: result.track.id, duplicate: result.duplicate};
  } finally {
    if (uri) await transfer.removeTemporaryFile(uri);
  }
}
