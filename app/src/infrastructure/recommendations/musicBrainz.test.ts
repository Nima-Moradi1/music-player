import {findRelatedRecordings} from './musicBrainz';

it('finds distinct recordings by the current artist without offering audio URLs', async () => {
  const fetcher = jest.fn(async () => ({
    ok: true,
    json: async () => ({
      recordings: [
        {
          id: '11111111-1111-1111-1111-111111111111',
          title: 'Anchor Song',
          'artist-credit': [{name: 'Example Artist'}],
        },
        {
          id: '22222222-2222-2222-2222-222222222222',
          title: 'Next Song',
          'artist-credit': [{name: 'Example Artist'}],
          tags: [{name: 'Rock'}],
        },
      ],
    }),
  })) as unknown as typeof fetch;
  const result = await findRelatedRecordings(
    {title: 'Anchor Song', artist: 'Example Artist', genre: 'Rock'},
    undefined,
    fetcher,
  );
  expect(result).toEqual([
    {
      id: '22222222-2222-2222-2222-222222222222',
      title: 'Next Song',
      artist: 'Example Artist',
      sourceUrl: 'https://musicbrainz.org/recording/22222222-2222-2222-2222-222222222222',
      reason: 'genre',
    },
  ]);
  expect(fetcher).toHaveBeenCalledWith(
    expect.stringContaining('musicbrainz.org/ws/2/recording/'),
    expect.objectContaining({headers: expect.objectContaining({'User-Agent': expect.any(String)})}),
  );
});
