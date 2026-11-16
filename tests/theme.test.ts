import { oklchToLinearSrgb } from '../lib/oklch';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_THEME,
  resolveTheme,
  parseTheme,
  resolveMode,
} from '../lib/theme';

function luminance(color: string) {
  const [red, green, blue] = oklchToLinearSrgb(color);
  return red * 0.2126 + green * 0.7152 + blue * 0.0722;
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
    expect(parseTheme('{"palette":"halloween","mode":"dark"}')).toEqual({
      palette: 'halloween',
      mode: 'dark',
    });
    expect(parseTheme('{"palette":"violet","mode":"light"}')).toEqual({
      palette: 'navy',
      mode: 'light',
    });
    expect(parseTheme('{"palette":"cobalt","mode":"unknown"}')).toEqual({
      palette: 'navy',
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
  expect(resolveTheme({ palette: 'navy', mode: 'light' }, true)).toBe(
    'TechLight',
  );
  expect(resolveTheme({ palette: 'navy', mode: 'system' }, true)).toBe(
    'TechDark',
  );
  expect(resolveTheme({ palette: 'night', mode: 'dark' }, false)).toBe('night');
  expect(resolveTheme({ palette: 'custom', mode: 'light' }, true)).toBe(
    'TechLight',
  );
  expect(resolveTheme({ palette: 'lemonade', mode: 'dark' }, false)).toBe(
    'TechDark',
  );
  expect(resolveTheme({ palette: 'bumblebee', mode: 'light' }, false)).toBe(
    'bumblebee',
  );
  expect(resolveTheme({ palette: 'halloween', mode: 'system' }, true)).toBe(
    'halloween',
  );
});

const brandCss = readFileSync('styles/brand-themes.css', 'utf8');
for (const block of brandCss.matchAll(
  /@plugin ['"]daisyui\/theme['"]\s*\{([^}]+)\}/g,
)) {
  const name = /name:\s*'([^']+)'/.exec(block[1])![1];
  const tokens = Object.fromEntries(
    [...block[1].matchAll(/--color-([\w-]+):\s*(oklch\([^)]*\));/g)].map(
      (m) => [m[1], m[2]],
    ),
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
  expect(resolveTheme(preference, false)).toBe('TechDark');
});
