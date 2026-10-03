import {activeLineIndex, parseLrc} from '.';

it('parses repeated LRC timestamps and finds the active line with local offset', () => {
  const lines = parseLrc('[00:01.50][00:02.500]Hello\n[00:04]World\n[bad]Ignore');
  expect(lines).toEqual([
    {atMs: 1500, text: 'Hello'},
    {atMs: 2500, text: 'Hello'},
    {atMs: 4000, text: 'World'},
  ]);
  expect(activeLineIndex(lines, 2999, 500)).toBe(0);
  expect(activeLineIndex(lines, 3000, 500)).toBe(1);
  expect(activeLineIndex(lines, 1000, 500)).toBe(-1);
});
