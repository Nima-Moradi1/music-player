import {ImportMedia} from './importMedia';
import {fixtureTrack} from '../../testing/fixtures';
import type {ManagedFilesystem} from './index';
import type {TrackRepository} from '../track';
describe('managed import transaction', () => {
  const track = {...fixtureTrack(1), contentHash: 'a'.repeat(64)};
  const source = {type: 'manual_import', originalFilename: 'music.mp3'} as const;
  function setup(existing = false) {
    const files: jest.Mocked<ManagedFilesystem> = {
      stage: jest.fn().mockResolvedValue('temp'),
      inspect: jest.fn().mockResolvedValue({
        path: 'temp',
        sha256: track.contentHash,
        mimeType: 'audio/mpeg',
        extension: 'mp3',
        fileSize: 100,
        title: 'Music',
        artist: 'Artist',
        album: '',
        genre: '',
        durationMs: 10000,
        artworkPath: null,
      }),
      promote: jest.fn().mockResolvedValue('managed'),
      remove: jest.fn().mockResolvedValue(undefined),
      reconcile: jest.fn().mockResolvedValue(undefined),
      freeBytes: jest.fn().mockResolvedValue(1e9),
    };
    const tracks: jest.Mocked<TrackRepository> = {
      findByHash: jest.fn().mockResolvedValue(existing ? track : null),
      save: jest.fn().mockResolvedValue(undefined),
      addSource: jest.fn().mockResolvedValue(undefined),
      list: jest.fn(),
      count: jest.fn(),
      collections: jest.fn(),
      get: jest.fn(),
      setFavorite: jest.fn(),
      setLanguage: jest.fn(),
    };
    return {
      files,
      tracks,
      importer: new ImportMedia(
        files,
        tracks,
        async () => track.id,
        () => 1e8,
      ),
    };
  }
  it('validates and hashes before moving and publishing a playable row', async () => {
    const {files, tracks, importer} = setup();
    const result = await importer.import('picked', source, new AbortController().signal);
    expect(result.duplicate).toBe(false);
    expect(result.track.canonicalUri).toBe('managed');
    expect(files.inspect).toHaveBeenCalledWith('temp', expect.anything());
    expect(tracks.save).toHaveBeenCalledWith(
      expect.objectContaining({contentHash: track.contentHash}),
      source,
    );
  });
  it('keeps one physical file while preserving duplicate provenance', async () => {
    const {files, tracks, importer} = setup(true);
    expect((await importer.import('picked', source, new AbortController().signal)).duplicate).toBe(
      true,
    );
    expect(files.promote).not.toHaveBeenCalled();
    expect(tracks.addSource).toHaveBeenCalledWith(track.id, source);
    expect(files.remove).toHaveBeenCalledWith('temp');
  });
  it('removes a promoted file if the database commit fails', async () => {
    const {files, tracks, importer} = setup();
    tracks.save.mockRejectedValue(new Error('Disk full'));
    await expect(importer.import('picked', source, new AbortController().signal)).rejects.toThrow(
      'Disk full',
    );
    expect(files.remove).toHaveBeenCalledWith('managed');
  });
  it('never publishes rejected/cancelled imports', async () => {
    const {files, tracks, importer} = setup();
    files.inspect.mockRejectedValue(new Error('Corrupt file'));
    await expect(importer.import('picked', source, new AbortController().signal)).rejects.toThrow();
    expect(tracks.save).not.toHaveBeenCalled();
    expect(files.remove).toHaveBeenCalledWith('temp');
    const abort = new AbortController();
    abort.abort();
    await expect(importer.import('picked', source, abort.signal)).rejects.toThrow();
  });
});
