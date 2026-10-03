import {findWikisourceLyrics} from './wikisource';

afterEach(() => jest.restoreAllMocks());

it('shows only matching source works with bounded plain text', async () => {
  jest
    .spyOn(globalThis, 'fetch')
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({query: {search: [{title: 'Bella ciao'}, {title: 'Unrelated novel'}]}}),
    } as Response)
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        query: {
          pages: {
            1: {title: 'Bella ciao', extract: 'Bella ciao, bella ciao, bella ciao ciao ciao'},
            2: {title: 'Unrelated novel', extract: 'A long unrelated work with many words to read'},
          },
        },
      }),
    } as Response);
  const found = await findWikisourceLyrics('Bella ciao', 'it', new AbortController().signal);
  expect(found).toHaveLength(1);
  expect(found[0]?.sourceUrl).toBe('https://it.wikisource.org/wiki/Bella_ciao');
});
