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

it('restarts the final song from zero after the queue ends', async () => {
  jest.useFakeTimers();
  const {first, native, controller} = setup();
  await controller.playTrack(first);
  native.getState.mockResolvedValueOnce(
    JSON.stringify({playing: false, ended: true, positionMs: 60000, durationMs: 60000}),
  );
  await controller.refresh();
  expect(controller.state.getState().ended).toBe(true);
  await controller.toggle();
  expect(native.seekTo).toHaveBeenCalledWith(0);
  expect(controller.state.getState().playing).toBe(true);
});

it('repeats one song or the whole queue on completion and preserves the mode', async () => {
  jest.useFakeTimers();
  const {first, second, native, tracks, controller} = setup();
  await controller.playTrack(first);
  controller.enqueue(second);
  controller.setRepeatMode('one');
  native.getState.mockResolvedValueOnce(
    JSON.stringify({playing: false, ended: true, positionMs: 60000, durationMs: 60000}),
  );
  await controller.refresh();
  expect(native.seekTo).toHaveBeenLastCalledWith(0);
  expect(controller.state.getState().trackId).toBe(first.id);
  controller.setRepeatMode('all');
  await controller.next();
  native.getState.mockResolvedValueOnce(
    JSON.stringify({playing: false, ended: true, positionMs: 60000, durationMs: 60000}),
  );
  await controller.refresh();
  expect(controller.state.getState().trackId).toBe(first.id);
  expect(JSON.parse(mockSaved.get('resume') ?? '{}').repeatMode).toBe('all');
  const restored = new PlaybackController(native, tracks);
  await restored.restore();
  expect(restored.state.getState().repeatMode).toBe('all');
});

it('previous restarts after three seconds and otherwise loads the prior queued track', async () => {
  jest.useFakeTimers();
  const {first, second, native, controller} = setup();
  await controller.playTrack(first);
  controller.enqueue(second);
  await controller.next();
  await controller.seekTo(8000);
  await controller.previous();
  expect(controller.state.getState().trackId).toBe(second.id);
  expect(native.seekTo).toHaveBeenLastCalledWith(0);
  await controller.previous();
  expect(controller.state.getState().trackId).toBe(first.id);
});

it('restores playback speed and delegates changes while paused', async () => {
  jest.useFakeTimers();
  const {first, native, tracks, controller} = setup();
  await controller.playTrack(first);
  await controller.toggle();
  await controller.setRate(1.5);
  expect(native.setRate).toHaveBeenLastCalledWith(1.5);
  const restored = new PlaybackController(native, tracks);
  await restored.restore();
  expect(restored.state.getState().rate).toBe(1.5);
  expect(native.setRate).toHaveBeenLastCalledWith(1.5);
});

it('persists shuffle and restores the manual queue when shuffle is turned off', async () => {
  jest.useFakeTimers();
  const {first, second, native, tracks, controller} = setup();
  await controller.playTrack(first);
  controller.enqueue(second);
  controller.setShuffle(true);
  expect(controller.state.getState().shuffle).toBe(true);
  const restored = new PlaybackController(native, tracks);
  await restored.restore();
  expect(restored.state.getState().shuffle).toBe(true);
  restored.setShuffle(false);
  expect(restored.state.getState().queue).toEqual([first.id, second.id]);
  restored.removeFromQueue(second.id);
  expect(JSON.parse(mockSaved.get('resume') ?? '{}').queue).toEqual([first.id]);
});
