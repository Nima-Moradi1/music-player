import type {Language} from './index';

export function normalizeSearch(text: string): string {
  return text
    .normalize('NFKC')
    .replace(/ي|ى/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/[\u064B-\u065F\u0670\u200c\u200d]/g, '')
    .toLocaleLowerCase('en')
    .replace(/\s+/g, ' ')
    .trim();
}
export function classifyLanguage(input: {
  metadataLanguage?: string;
  correction?: Language;
  text: string;
}): {language: Language; confidence: number} {
  if (input.correction) {
    return {language: input.correction, confidence: 1};
  }
  const code = input.metadataLanguage?.toLowerCase().split(/[-_]/)[0];
  if (code && ['fa', 'en', 'ar', 'es', 'de', 'it'].includes(code)) {
    return {language: code as Language, confidence: 0.95};
  }
  // Script is useful evidence but cannot distinguish Persian/Arabic or Latin languages.
  return {language: 'other', confidence: 0};
}
