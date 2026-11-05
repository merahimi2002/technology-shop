import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_THEME,
  resolveTheme,
  parseTheme,
  resolveMode,
} from '../lib/theme';

function luminance(hex: string) {
  const hsl = /^hsl\(([\d.]+) ([\d.]+)% ([\d.]+)%\)$/.exec(hex);
  if (hsl) {
    const h = Number(hsl[1]) / 30;
    const saturation = Number(hsl[2]) / 100;
    const lightness = Number(hsl[3]) / 100;
    const a = saturation * Math.min(lightness, 1 - lightness);
    const channels = [0, 8, 4].map((n) => {
      const k = (n + h) % 12;
      return lightness - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    });
    const linear = channels.map((n) =>
      n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4,
    );
    return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
  }
  const rgb = hex
    .replace('#', '')
    .match(/.{2}/g)!
    .map((part) => {
      const n = parseInt(part, 16) / 255;
      return n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4;
    });
  return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
}
function contrast(a: string, b: string) {
  const l1 = luminance(a);
  const l2 = luminance(b);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

describe('theme preferences', () => {
  it('recovers safely from missing, corrupt and hostile storage values', () => {
    for (const value of [
      null,
      'broken',
      '[]',
      'null',
      '"dark"',
      '{"palette":"__proto__","mode":"auto"}',
      '{"palette":"constructor"}',
    ]) {
      expect(parseTheme(value)).toEqual(DEFAULT_THEME);
    }
  });
  it('restores supported preferences and independently repairs invalid fields', () => {
    expect(parseTheme('{"palette":"violet","mode":"dark"}')).toEqual({
      palette: 'violet',
      mode: 'dark',
    });
    expect(parseTheme('{"palette":"unknown","mode":"light"}')).toEqual({
      palette: 'navy',
      mode: 'light',
    });
    expect(parseTheme('{"palette":"cobalt","mode":"unknown"}')).toEqual({
      palette: 'cobalt',
      mode: 'system',
    });
  });
  it('honors explicit mode over system changes', () => {
    expect(resolveMode('light', true)).toBe('light');
    expect(resolveMode('dark', false)).toBe('dark');
    expect(resolveMode('system', true)).toBe('dark');
    expect(resolveMode('system', false)).toBe('light');
  });
});

it('maps each palette and mode to the matching daisyUI theme', () => {
  expect(resolveTheme({ palette: 'navy', mode: 'light' }, true)).toBe('nord');
  expect(resolveTheme({ palette: 'navy', mode: 'system' }, true)).toBe('night');
  expect(resolveTheme({ palette: 'cobalt', mode: 'light' }, false)).toBe(
    'winter',
  );
  expect(resolveTheme({ palette: 'cobalt', mode: 'dark' }, false)).toBe('dim');
  expect(resolveTheme({ palette: 'violet', mode: 'light' }, false)).toBe(
    'cupcake',
  );
  expect(resolveTheme({ palette: 'violet', mode: 'system' }, true)).toBe(
    'dracula',
  );
});

const brandCss = readFileSync('styles/brand-themes.css', 'utf8');
for (const block of brandCss.matchAll(
  /@plugin 'daisyui\/theme'\s*\{([^}]+)\}/g,
)) {
  const name = /name:\s*'([^']+)'/.exec(block[1])![1];
  const tokens = Object.fromEntries(
    [
      ...block[1].matchAll(/--color-([\w-]+):\s*(#[\da-fA-F]+|hsl\([^)]*\));/g),
    ].map((m) => [m[1], m[2]]),
  );
  for (const color of ['primary', 'secondary']) {
    it(`${name} ${color} button label contrast is at least 4.5:1`, () => {
      expect(
        contrast(tokens[color], tokens[`${color}-content`]),
      ).toBeGreaterThanOrEqual(4.5);
    });
  }
}

it('restores custom colors and repairs invalid color values', () => {
  const preference = parseTheme(
    JSON.stringify({
      palette: 'custom',
      mode: 'dark',
      colors: {
        light: { primary: '#123456', secondary: 'url(x)' },
        dark: { primary: '#abcdef', secondary: '#112233' },
      },
    }),
  );
  expect(preference.colors?.light.primary).toBe('#123456');
  expect(preference.colors?.light.secondary).toBe('#008879');
  expect(preference.colors?.dark.primary).toBe('#abcdef');
  expect(resolveTheme(preference, false)).toBe('night');
});
