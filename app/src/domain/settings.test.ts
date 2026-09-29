import {defaultSettings, parseSettings} from './settings';
it('recovers corrupt/unsupported settings versions without accepting invalid limits', () => {
  expect(parseSettings({version: 99})).toEqual(defaultSettings);
  expect(parseSettings({...defaultSettings, maxImportBytes: -1})).toEqual(defaultSettings);
  expect(parseSettings({...defaultSettings, locale: 'fa', theme: 'dark'}).locale).toBe('fa');
});
