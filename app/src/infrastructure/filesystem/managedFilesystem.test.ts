import {NativeManagedFilesystem} from './managedFilesystem';
import type {ManagedMediaNativeV1} from '../../native/ManagedMedia';
it('removes a staged file when cancellation races with native completion', async () => {
  const controller = new AbortController();
  const bridge: jest.Mocked<ManagedMediaNativeV1> = {
    createId: jest.fn().mockResolvedValue('job'),
    stage: jest.fn().mockImplementation(async () => {
      controller.abort();
      return 'private-temp';
    }),
    download: jest.fn(),
    inspect: jest.fn(),
    promote: jest.fn(),
    remove: jest.fn().mockResolvedValue(undefined),
    reconcile: jest.fn().mockResolvedValue(undefined),
    freeBytes: jest.fn(),
    cancel: jest.fn(),
  };
  await expect(
    new NativeManagedFilesystem(bridge).stage('picked', 100, controller.signal),
  ).rejects.toMatchObject({name: 'AbortError'});
  expect(bridge.cancel).toHaveBeenCalledWith('job');
  expect(bridge.remove).toHaveBeenCalledWith('private-temp');
});
