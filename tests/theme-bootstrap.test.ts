import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { expect, it } from 'vitest';
import { THEME_BOOTSTRAP } from '../lib/theme';

it.each([
  {
    stored: '{"palette":"violet","mode":"dark"}',
    systemDark: false,
    expected: 'TechDark',
  },
  {
    stored: '{"palette":"cobalt","mode":"system"}',
    systemDark: true,
    expected: 'TechDark',
  },
  { stored: 'corrupt', systemDark: false, expected: 'TechLight' },
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
  expect(root.dataset).toEqual({ theme: 'TechDark' });
});

it('loads the saved palette and preview styles before hydration', () => {
  const stylesheet = { id: '', textContent: '' };
  const root = { dataset: {} as Record<string, string> };
  const appended: unknown[] = [];
  runInNewContext(THEME_BOOTSTRAP, {
    document: {
      documentElement: root,
      getElementById: () => null,
      createElement: () => stylesheet,
      head: { append: (element: unknown) => appended.push(element) },
    },
    localStorage: {
      getItem: () =>
        '{"palette":"custom","mode":"dark","colors":{"dark":{"primary":"#ffffff","secondary":"#000000"}}}',
    },
    matchMedia: () => ({ matches: false }),
  });
  expect(root.dataset.theme).toBe('TechDark');
  expect(appended).toEqual([stylesheet]);
  expect(stylesheet.id).toBe('saved-theme-colors');
  expect(stylesheet.textContent).toContain('.palette-card:has(');
  expect(stylesheet.textContent).toContain(
    ':root{--color-primary:#ffffff;--color-primary-content:#000000;--color-secondary:#000000;--color-secondary-content:#ffffff}',
  );
});

it('keeps approved brand geometry in the default favicon', () => {
  const logo = readFileSync('public/logo.svg', 'utf8');
  const geometry = [...logo.matchAll(/ d="([^"]+)"/g)].map((m) => m[1]);
  const icon = readFileSync('public/favicons/navy.svg', 'utf8');
  expect([...icon.matchAll(/ d="([^"]+)"/g)].map((m) => m[1])).toEqual(
    geometry,
  );
  expect(readFileSync('app/icon.svg', 'utf8')).toBe(icon);
});
