import {classifyLanguage, normalizeSearch} from './normalize';
describe('local categorization and search', () => {
  it('normalizes letter variants without changing the source string', () => {
    expect(normalizeSearch('  كيان يارِ من  ')).toBe('کیان یار من');
    expect(normalizeSearch('CAFÉ   Song')).toBe('café song');
  });
  it('does not infer Persian/Arabic or English from script alone', () => {
    for (const text of ['سلام دنیا', 'مرحبا', 'Salam', 'hello']) {
      expect(classifyLanguage({text}).language).toBe('other');
    }
  });
  it('trusts explicit metadata and always respects a user correction', () => {
    expect(classifyLanguage({text: 'سلام', metadataLanguage: 'fa-IR'}).language).toBe('fa');
    expect(classifyLanguage({text: 'Song', metadataLanguage: 'de-DE'}).language).toBe('de');
    expect(classifyLanguage({text: 'Song', metadataLanguage: 'it_IT'}).language).toBe('it');
    expect(
      classifyLanguage({
        text: 'سلام',
        metadataLanguage: 'fa',
        correction: 'ar',
      }),
    ).toEqual({language: 'ar', confidence: 1});
  });
});
