import {palettes} from './index';
function luminance(hex: string) {
  const components = [1, 3, 5].map(index => {
    const c = parseInt(hex.slice(index, index + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return (
    (components[0] ?? 0) * 0.2126 + (components[1] ?? 0) * 0.7152 + (components[2] ?? 0) * 0.0722
  );
}
function contrast(a: string, b: string) {
  const x = luminance(a),
    y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
it.each(Object.keys(palettes) as (keyof typeof palettes)[])(
  '%s semantic text meets WCAG AA on solid surfaces',
  key => {
    const palette = palettes[key];
    for (const background of [palette.background, palette.surface, palette.elevated]) {
      expect(contrast(palette.text, background)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(palette.muted, background)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(palette.danger, background)).toBeGreaterThanOrEqual(4.5);
    }
    expect(contrast(palette.onAccent, palette.accent)).toBeGreaterThanOrEqual(4.5);
  },
);
