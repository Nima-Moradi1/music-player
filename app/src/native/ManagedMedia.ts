import {NativeModules} from 'react-native';
export interface ManagedMediaNativeV1 {
  createId(): Promise<string>;
  stage(jobId: string, uri: string, maxBytes: number): Promise<string>;
  download(jobId: string, url: string, maxBytes: number): Promise<string>;
  inspect(jobId: string, path: string): Promise<string>;
  promote(path: string, hash: string, extension: string): Promise<string>;
  remove(path: string): Promise<void>;
  freeBytes(): Promise<number>;
  reconcile(ownedPathsJson: string): Promise<void>;
  cancel(jobId: string): void;
}
// Version 1 bridge. NativeModules is isolated here; New Architecture interop owns serialization.
export function managedMediaNative(): ManagedMediaNativeV1 {
  const module: unknown = NativeModules.ManagedMedia;
  if (!module) {
    throw new Error('ManagedMedia native module is not installed');
  }
  return module as ManagedMediaNativeV1;
}
