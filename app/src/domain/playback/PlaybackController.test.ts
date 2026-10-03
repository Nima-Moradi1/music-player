import {PlaybackController} from './PlaybackController';
import type {NativeAudioV1} from '../../native/NativeAudio';
import type {TrackRepository} from '../track';
import {fixtureTrack} from '../../testing/fixtures';

const mockSaved = new Map<string, string>();
jest.mock('react-native-mmkv', () => ({
  createMMKV: () => ({
    getString: (key: string) => mockSaved.get(key),
    set: (key: string, value: string) => {
      mockSaved.set(key, value);
    },
    remove: (key: string) => {
      mockSaved.delete(key);
    },
  }),
}));

function setup() {
  const first = {...fixtureTrack(1), managedPath: 'file:///managed/one.mp3'};
  const second = {...fixtureTrack(2), managedPath: 'file:///managed/two.mp3'};
  const native = {
    load: jest.fn(async () => undefined),
    play: jest.fn(async () => undefined),
    pause: jest.fn(async () => undefined),
    stop: jest.fn(async () => undefined),
    seekTo: jest.fn(async () => undefined),
    setRate: jest.fn(async () => undefined),
    setVolume: jest.fn(async () => undefined),
    setSleepTimer: jest.fn(async () => undefined),
    setABRepeat: jest.fn(async () => undefined),
    getState: jest.fn(async () =>
      JSON.stringify({playing: true, ended: false, positionMs: 12000, durationMs: 60000}),
    ),
  } satisfies NativeAudioV1;
  const tracks = {
    get: jest.fn(async (id: string) => [first, second].find(track => track.id === id) ?? null),
  } as unknown as TrackRepository;
  return {first, second, native, tracks, controller: new PlaybackController(native, tracks)};
}

afterEach(() => {
  jest.clearAllTimers();
  mockSaved.clear();
});

it('restores a paused imported song at its mockSaved position without auto-playing', async () => {
  jest.useFakeTimers();
  const {first, native, tracks} = setup();
  mockSaved.set(
    'resume',
    JSON.stringify({trackId: first.id, positionMs: 12000, queue: [first.id]}),
  );
  const controller = new PlaybackController(native, tracks);
  await controller.restore();
  expect(native.load).toHaveBeenCalledWith(first.managedPath, first.title, first.artist);
  expect(native.seekTo).toHaveBeenCalledWith(12000);
  expect(native.play).not.toHaveBeenCalled();
  expect(controller.state.getState().trackId).toBe(first.id);
});

it('advances through a persisted queue when native playback ends', async () => {
  jest.useFakeTimers();
  const {first, second, native, controller} = setup();
  await controller.playTrack(first);
  controller.enqueue(second);
  native.getState.mockResolvedValueOnce(
    JSON.stringify({playing: false, ended: true, positionMs: 60000, durationMs: 60000}),
  );
  await controller.refresh();
  expect(native.load).toHaveBeenLastCalledWith(second.managedPath, second.title, second.artist);
  expect(native.play).toHaveBeenCalledTimes(2);
  expect(controller.state.getState().trackId).toBe(second.id);
  expect(JSON.parse(mockSaved.get('resume') ?? '{}').queue).toEqual([first.id, second.id]);
});

it('delegates sleep and A-B repeat to native playback', async () => {
  jest.useFakeTimers();
  const {first, native, controller} = setup();
  await controller.playTrack(first);
  await controller.setSleepTimer(30);
  await controller.markRepeatStart(5000);
  await controller.setABRepeat(5000, 15000);
  expect(native.setSleepTimer).toHaveBeenCalledWith(1800);
  expect(native.setABRepeat).toHaveBeenLastCalledWith(5000, 15000);
  expect(controller.state.getState().repeatEndMs).toBe(15000);
  await controller.setSleepTimer(0);
  await controller.setABRepeat(null, null);
  expect(native.setSleepTimer).toHaveBeenLastCalledWith(0);
  expect(native.setABRepeat).toHaveBeenLastCalledWith(-1, -1);
});
