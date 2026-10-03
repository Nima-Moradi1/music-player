import {commonsProvider, searchCommonsAudio} from './commons';
import {importLicensedDownload} from '../../domain/downloads/licensedDownload';
import type {MediaImporter} from '../../domain/import';
import type {LicensedDownloadTransfer} from '../../domain/downloads/licensedDownload';

const page = (license = 'CC BY 4.0') => ({
  title: 'File:Example music.mp3',
  imageinfo: [
    {
      url: 'https://upload.wikimedia.org/wikipedia/commons/a/ab/Example_music.mp3',
      descriptionurl: 'https://commons.wikimedia.org/wiki/File:Example_music.mp3',
      size: 1024,
      mediatype: 'AUDIO',
      extmetadata: {
        LicenseShortName: {value: license},
        LicenseUrl: {value: 'https://creativecommons.org/licenses/by/4.0'},
        Artist: {value: '<a href="/wiki/User:Artist">Artist</a>'},
      },
    },
  ],
});
const response = (pages: unknown[]) => ({
  ok: true,
  json: async () => ({
    query: {pages: Object.fromEntries(pages.map((item, index) => [index, item]))},
  }),
});

afterEach(() => jest.restoreAllMocks());

it('accepts attributed Creative Commons audio and excludes unknown rights', async () => {
  const fetchMock = jest
    .spyOn(globalThis, 'fetch')
    .mockResolvedValue(response([page(), page('All rights reserved')]) as Response);
  const found = await searchCommonsAudio('music', new AbortController().signal);
  expect(found).toHaveLength(1);
  expect(found[0]).toMatchObject({
    author: 'Artist',
    license: 'CC BY 4.0',
    offlineCopyAllowed: true,
  });
  expect(fetchMock.mock.calls[0]?.[0]).toContain('filetype%3Aaudio');
});

it('rechecks rights before transfer and preserves attribution through import', async () => {
  jest
    .spyOn(globalThis, 'fetch')
    .mockResolvedValueOnce(response([page()]) as Response)
    .mockResolvedValueOnce(response([page()]) as Response);
  const offer = (await searchCommonsAudio('music', new AbortController().signal))[0]!;
  const transfer: LicensedDownloadTransfer = {
    freeBytes: jest.fn().mockResolvedValue(10_000_000),
    downloadToTemporaryFile: jest.fn().mockResolvedValue('file:///temp.part'),
    removeTemporaryFile: jest.fn().mockResolvedValue(undefined),
  };
  const importer = {
    import: jest.fn().mockResolvedValue({track: {id: 'track'}, duplicate: false}),
  } as unknown as MediaImporter;
  await importLicensedDownload({
    offer,
    provider: commonsProvider,
    transfer,
    importer,
    maxBytes: 1024 * 1024,
    signal: new AbortController().signal,
  });
  expect(importer.import).toHaveBeenCalledWith(
    'file:///temp.part',
    expect.objectContaining({
      type: 'app_download',
      providerId: 'wikimedia-commons',
      author: 'Artist',
      license: 'CC BY 4.0',
    }),
    expect.anything(),
  );
  expect(transfer.removeTemporaryFile).toHaveBeenCalledWith('file:///temp.part');
});

it('rejects changed rights before downloading', async () => {
  jest
    .spyOn(globalThis, 'fetch')
    .mockResolvedValueOnce(response([page()]) as Response)
    .mockResolvedValueOnce(response([page('All rights reserved')]) as Response);
  const offer = (await searchCommonsAudio('music', new AbortController().signal))[0]!;
  await expect(commonsProvider.resolve(offer, new AbortController().signal)).rejects.toThrow();
});
