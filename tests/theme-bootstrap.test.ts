import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { expect, it } from 'vitest';
import { THEME_BOOTSTRAP } from '../lib/theme';

it.each([
  {
    stored: '{"palette":"violet","mode":"dark"}',
    systemDark: false,
    expected: 'dracula',
  },
  {
    stored: '{"palette":"cobalt","mode":"system"}',
    systemDark: true,
    expected: 'dim',
  },
  { stored: 'corrupt', systemDark: false, expected: 'nord' },
])(
  'applies the correct theme before hydration: $expected',
  ({ stored, systemDark, expected }) => {
    const root = {
      dataset: {} as Record<string, string>,
    };
    runInNewContext(THEME_BOOTSTRAP, {
      document: { documentElement: root },
      localStorage: { getItem: () => stored },
      matchMedia: () => ({ matches: systemDark }),
    });
    expect(root.dataset.theme).toEqual(expected);
  },
);

it('initializes safely when storage is denied', () => {
  const root = {
    dataset: {} as Record<string, string>,
  };
  runInNewContext(THEME_BOOTSTRAP, {
    document: { documentElement: root },
    localStorage: {
      getItem: () => {
        throw new Error('SecurityError');
      },
    },
    matchMedia: () => ({ matches: true }),
  });
  expect(root.dataset).toEqual({ theme: 'night' });
});

it('keeps approved brand geometry and all three favicon variants', () => {
  const logo = readFileSync('public/logo.svg', 'utf8');
  const geometry = [...logo.matchAll(/ d="([^"]+)"/g)].map((m) => m[1]);
  for (const name of ['navy', 'cobalt', 'violet']) {
    const icon = readFileSync(`public/favicons/${name}.svg`, 'utf8');
    expect([...icon.matchAll(/ d="([^"]+)"/g)].map((m) => m[1])).toEqual(
      geometry,
    );
  }
  expect(readFileSync('app/icon.svg', 'utf8')).toBe(
    readFileSync('public/favicons/navy.svg', 'utf8'),
  );
});
