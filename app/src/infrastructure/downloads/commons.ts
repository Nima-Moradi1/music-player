import type {
  LicensedDownloadProvider,
  LicensedOffer,
} from '../../domain/downloads/licensedDownload';

const api = 'https://commons.wikimedia.org/w/api.php';
const maxBytes = 512 * 1024 * 1024;
const userAgent = 'MusicPlayer/0.1 (https://github.com/Nima-Moradi1/music-player)';

type Metadata = Record<string, {value?: string}>;
type CommonsPage = {
  title?: string;
  imageinfo?: Array<{
    url?: string;
    descriptionurl?: string;
    size?: number;
    mediatype?: string;
    extmetadata?: Metadata;
  }>;
};

function plain(value: string): string {
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 300);
}

function offer(page: CommonsPage): LicensedOffer | null {
  const info = page.imageinfo?.[0];
  const title = page.title;
  const license = plain(info?.extmetadata?.LicenseShortName?.value ?? '');
  const licenseUrl = info?.extmetadata?.LicenseUrl?.value ?? '';
  const author = plain(info?.extmetadata?.Artist?.value ?? '');
  const url = info?.url;
  const sourceUrl = info?.descriptionurl;
  if (
    !title?.startsWith('File:') ||
    !/\.(mp3|flac|m4a|aac)$/i.test(title) ||
    info?.mediatype !== 'AUDIO' ||
    !info.size ||
    info.size > maxBytes ||
    !/^(CC0 1\.0|CC BY(?:-SA)? (?:3\.0|4\.0))$/.test(license) ||
    !licenseUrl.startsWith('https://creativecommons.org/') ||
    (license === 'CC0 1.0' && !licenseUrl.includes('/publicdomain/zero/1.0')) ||
    (license !== 'CC0 1.0' &&
      !licenseUrl.includes(
        `/licenses/${license.startsWith('CC BY-SA') ? 'by-sa' : 'by'}/${license.slice(-3)}`,
      )) ||
    !author ||
    !url?.startsWith('https://upload.wikimedia.org/') ||
    !sourceUrl?.startsWith('https://commons.wikimedia.org/')
  )
    return null;
  return {
    providerId: 'wikimedia-commons',
    itemId: title,
    filename: title.slice(5),
    sizeBytes: info.size,
    offlineCopyAllowed: true,
    license,
    author,
    sourceUrl,
    licenseUrl,
  };
}

async function query(params: Record<string, string>, signal: AbortSignal): Promise<CommonsPage[]> {
  const url = new URL(api);
  Object.entries({
    action: 'query',
    format: 'json',
    prop: 'imageinfo',
    iiprop: 'url|size|extmetadata|mediatype',
    iiextmetadatafilter: 'LicenseShortName|LicenseUrl|Artist',
    ...params,
  }).forEach(([key, value]) => url.searchParams.set(key, value));
  const response = await fetch(url.toString(), {headers: {'User-Agent': userAgent}, signal});
  if (!response.ok) throw new Error('Commons catalog unavailable');
  const json = (await response.json()) as {query?: {pages?: Record<string, CommonsPage>}};
  return Object.values(json.query?.pages ?? {});
}

export async function searchCommonsAudio(
  search: string,
  signal: AbortSignal,
): Promise<LicensedOffer[]> {
  const words = search
    .trim()
    .replace(/[^\p{L}\p{N}\s'-]/gu, ' ')
    .slice(0, 100);
  if (words.length < 2) return [];
  const pages = await query(
    {
      generator: 'search',
      gsrsearch: `filetype:audio filemime:audio/mpeg ${words}`,
      gsrnamespace: '6',
      gsrlimit: '40',
    },
    signal,
  );
  return pages.map(offer).filter((item): item is LicensedOffer => item !== null);
}

export const commonsProvider: LicensedDownloadProvider = {
  id: 'wikimedia-commons',
  async resolve(selected, signal) {
    const itemId = selected.itemId;
    if (!/^File:[^\n]{1,250}\.(mp3|flac|m4a|aac)$/i.test(itemId)) {
      throw new Error('Invalid Commons file');
    }
    const pages = await query({titles: itemId}, signal);
    const current = pages.map(offer).find(Boolean);
    if (
      !current ||
      current.itemId !== itemId ||
      current.sizeBytes !== selected.sizeBytes ||
      current.license !== selected.license ||
      current.licenseUrl !== selected.licenseUrl ||
      current.author !== selected.author ||
      current.sourceUrl !== selected.sourceUrl
    ) {
      throw new Error('Commons file metadata changed');
    }
    const url = pages[0]?.imageinfo?.[0]?.url;
    if (!url?.startsWith('https://upload.wikimedia.org/'))
      throw new Error('Commons URL unavailable');
    return {url, expiresAt: Date.now() + 60_000, offlineCopyAllowed: true};
  },
};
