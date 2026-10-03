import type {Language} from '../../domain/track';

export type WikisourceLyric = {
  title: string;
  text: string;
  sourceUrl: string;
  language: 'en' | 'es' | 'de' | 'it';
};
type Supported = WikisourceLyric['language'];
const languages = new Set<Language>(['en', 'es', 'de', 'it']);

async function api(language: Supported, params: Record<string, string>, signal: AbortSignal) {
  const url = new URL(`https://${language}.wikisource.org/w/api.php`);
  Object.entries({action: 'query', format: 'json', ...params}).forEach(([key, value]) =>
    url.searchParams.set(key, value),
  );
  const response = await fetch(url.toString(), {
    signal,
    headers: {
      'User-Agent': 'MusicPlayer/0.1 (https://github.com/Nima-Moradi1/music-player)',
    },
  });
  if (!response.ok) throw new Error('Wikisource unavailable');
  return response.json();
}

export async function findWikisourceLyrics(
  title: string,
  language: Language,
  signal: AbortSignal,
): Promise<WikisourceLyric[]> {
  if (!languages.has(language) || !title.trim()) return [];
  const site = language as Supported;
  const search = (await api(
    site,
    {
      list: 'search',
      srsearch: title.trim().slice(0, 100),
      srnamespace: '0',
      srlimit: '12',
    },
    signal,
  )) as {query?: {search?: Array<{title?: string}>}};
  const names = (search.query?.search ?? [])
    .map(item => item.title)
    .filter((name): name is string => !!name);
  if (!names.length) return [];
  const result = (await api(
    site,
    {
      prop: 'extracts',
      explaintext: '1',
      exlimit: '12',
      titles: names.join('|'),
      redirects: '1',
    },
    signal,
  )) as {query?: {pages?: Record<string, {title?: string; extract?: string; missing?: string}>}};
  return Object.values(result.query?.pages ?? {})
    .flatMap(page => {
      const text = page.extract?.trim() ?? '';
      const needle = title.trim().toLocaleLowerCase();
      if (
        !page.title ||
        'missing' in page ||
        !page.title.toLocaleLowerCase().includes(needle) ||
        text.length < 30 ||
        text.length > 10_000
      )
        return [];
      return [
        {
          title: page.title,
          text,
          language: site,
          sourceUrl: `https://${site}.wikisource.org/wiki/${encodeURIComponent(page.title.replace(/ /g, '_'))}`,
        },
      ];
    })
    .slice(0, 8);
}
