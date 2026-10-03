import {NativeModules} from 'react-native';

export type NativePlaybackState = {
  playing: boolean;
  ended: boolean;
  positionMs: number;
  durationMs: number;
};

export interface NativeAudioV1 {
  load(uri: string, title: string, artist: string): Promise<void>;
  play(): Promise<void>;
  pause(): Promise<void>;
  stop(): Promise<void>;
  seekTo(ms: number): Promise<void>;
  setRate(rate: number): Promise<void>;
  setVolume(value: number): Promise<void>;
  setSleepTimer(seconds: number): Promise<void>;
  setABRepeat(startMs: number, endMs: number): Promise<void>;
  getState(): Promise<string>;
}

export function nativeAudio(): NativeAudioV1 {
  const module: unknown = NativeModules.NativeAudio;
  if (!module) {
    throw new Error('NativeAudio native module is not installed');
  }
  return module as NativeAudioV1;
}
