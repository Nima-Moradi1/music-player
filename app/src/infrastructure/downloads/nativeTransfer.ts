import type {LicensedDownloadTransfer} from '../../domain/downloads/licensedDownload';
import {managedMediaNative} from '../../native/ManagedMedia';

export const nativeDownloadTransfer: LicensedDownloadTransfer = {
  async downloadToTemporaryFile(url, maxBytes, signal) {
    if (signal.aborted) throw new Error('Cancelled');
    const bridge = managedMediaNative();
    const id = await bridge.createId();
    const cancel = () => bridge.cancel(id);
    signal.addEventListener('abort', cancel, {once: true});
    try {
      if (signal.aborted) throw new Error('Cancelled');
      const path = await bridge.download(id, url, maxBytes);
      if (signal.aborted) {
        await bridge.remove(path);
        throw new Error('Cancelled');
      }
      return path;
    } finally {
      signal.removeEventListener('abort', cancel);
    }
  },
  removeTemporaryFile(uri) {
    return managedMediaNative().remove(uri);
  },
  freeBytes() {
    return managedMediaNative().freeBytes();
  },
};
