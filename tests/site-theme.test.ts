import { beforeEach, expect, it, vi } from 'vitest';
import { runInNewContext } from 'node:vm';
import { saveSiteThemes } from '@/app/[locale]/admin/settings/theme/actions';
import {
  DEFAULT_SITE_THEMES,
  SITE_THEME_STORAGE_KEY,
  isSiteTheme,
  isThemeSelection,
  ADMIN_THEMES,
  parseVisitorTheme,
  resolveVisitorTheme,
  themeBootstrap,
} from '@/lib/site-theme';
const { getCurrentUser, upsert, revalidatePath } = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  upsert: vi.fn(),
  revalidatePath: vi.fn(),
}));
vi.mock('@/lib/auth/session', () => ({ getCurrentUser }));
vi.mock('@/lib/db', () => ({ getDb: () => ({ siteSettings: { upsert } }) }));
vi.mock('next/cache', () => ({ revalidatePath }));
beforeEach(() => {
  vi.resetAllMocks();
  upsert.mockResolvedValue({});
});
it.each([null, 'CUSTOMER'])(
  'rejects unauthorized writes from %s',
  async (role) => {
    getCurrentUser.mockResolvedValue(role ? { role } : null);
    expect(await saveSiteThemes(DEFAULT_SITE_THEMES)).toBe('error');
    expect(upsert).not.toHaveBeenCalled();
  },
);
it.each(['ADMIN', 'OWNER'])(
  'saves exactly four choices for %s',
  async (role) => {
    getCurrentUser.mockResolvedValue({ role });
    expect(await saveSiteThemes(DEFAULT_SITE_THEMES)).toBe('saved');
    expect(upsert).toHaveBeenCalledWith({
      where: { id: 'site' },
      create: { id: 'site', themes: DEFAULT_SITE_THEMES },
      update: { themes: DEFAULT_SITE_THEMES },
    });
    expect(revalidatePath).toHaveBeenCalledWith('/', 'layout');
  },
);
it.each([
  null,
  [],
  ['night'],
  ['light', 'dark', 'night'],
  ['light', 'dark', 'night', 'night'],
  ['light', 'dark', 'night', 'constructor'],
  ['light', 'dark', 'night', '__proto__'],
  ['light', 'dark', 'night', 'custom'],
  ['TechLight', 'night', 'lemonade', 'bumblebee'],
  ['TechDark', 'night', 'lemonade', 'bumblebee'],
  ['light', 'dark', 'night', 'lemonade', 'coffee'],
])('rejects invalid or duplicate theme selections: %j', async (themes) => {
  getCurrentUser.mockResolvedValue({ role: 'OWNER' });
  expect(await saveSiteThemes(themes)).toBe('error');
  expect(upsert).not.toHaveBeenCalled();
});
it('reports a failed write without invalidating layouts', async () => {
  getCurrentUser.mockResolvedValue({ role: 'ADMIN' });
  upsert.mockRejectedValue(new Error('offline'));
  expect(await saveSiteThemes(DEFAULT_SITE_THEMES)).toBe('error');
  expect(revalidatePath).not.toHaveBeenCalled();
});
it('exposes exactly the official themes to administrators, excluding the fixed brand pair', async () => {
  const { default: installed } = await import('daisyui/theme/object.js');
  expect(ADMIN_THEMES).toEqual(
    Object.fromEntries(
      Object.entries(installed).map(([name, value]) => [
        name,
        value['color-scheme'],
      ]),
    ),
  );
  expect(Object.keys(ADMIN_THEMES)).not.toContain('TechLight');
  expect(Object.keys(ADMIN_THEMES)).not.toContain('TechDark');
});
it('always defaults visitors to the fixed brand option', () => {
  for (const stored of [null, 'corrupt', '"coffee"', '"constructor"', '{}'])
    expect(parseVisitorTheme(stored, DEFAULT_SITE_THEMES).choice).toBe('brand');
  expect(parseVisitorTheme('"night"', DEFAULT_SITE_THEMES).choice).toBe(
    'night',
  );
  expect(isThemeSelection(DEFAULT_SITE_THEMES)).toBe(true);
  expect(isSiteTheme(null)).toBe(false);
});
it('keeps brand and custom choices independent of the four administrator themes', () => {
  for (const choice of ['brand', 'custom']) {
    const preference = parseVisitorTheme(
      JSON.stringify({
        choice,
        mode: 'dark',
        colors: { dark: { primary: '#123456' } },
      }),
      DEFAULT_SITE_THEMES,
    );
    expect(preference.choice).toBe(choice);
    expect(preference.colors.dark.primary).toBe('#123456');
    expect(resolveVisitorTheme(preference, false)).toBe('TechDark');
    expect(resolveVisitorTheme({ ...preference, mode: 'light' }, true)).toBe(
      'TechLight',
    );
  }
});
it('uses the brand counterpart when changing the mode of an official theme', () => {
  const preference = parseVisitorTheme('"night"', DEFAULT_SITE_THEMES);
  expect(resolveVisitorTheme(preference, false)).toBe('night');
  expect(resolveVisitorTheme({ ...preference, mode: 'light' }, false)).toBe(
    'TechLight',
  );
});
it.each([
  '"night"',
  '"coffee"',
  'corrupt',
  null,
  '{"choice":"brand","mode":"dark"}',
  '{"choice":"night","mode":"light"}',
])('matches bootstrap and hydration for %s', (stored) => {
  const root = { dataset: {} as Record<string, string> };
  runInNewContext(themeBootstrap(DEFAULT_SITE_THEMES), {
    document: { documentElement: root },
    matchMedia: () => ({ matches: true }),
    localStorage: {
      getItem: (key: string) => {
        expect(key).toBe(SITE_THEME_STORAGE_KEY);
        return stored;
      },
    },
  });
  expect(root.dataset.theme).toBe(
    resolveVisitorTheme(parseVisitorTheme(stored, DEFAULT_SITE_THEMES), true),
  );
});
it('restores custom colors before hydration with contrast-safe text', () => {
  const sheet = { id: '', textContent: '' };
  const root = { dataset: {} as Record<string, string> };
  runInNewContext(themeBootstrap(DEFAULT_SITE_THEMES), {
    document: {
      documentElement: root,
      getElementById: () => null,
      createElement: () => sheet,
      head: { append: () => {} },
    },
    matchMedia: () => ({ matches: false }),
    localStorage: {
      getItem: () =>
        JSON.stringify({
          choice: 'custom',
          mode: 'dark',
          colors: { dark: { primary: '#ffffff', secondary: '#000000' } },
        }),
    },
  });
  expect(root.dataset.theme).toBe('TechDark');
  expect(sheet.textContent).toContain(
    ':root{--color-primary:#ffffff;--color-primary-content:#000000',
  );
});
it('bootstraps the system brand mode when storage is denied', () => {
  const root = { dataset: {} as Record<string, string> };
  runInNewContext(themeBootstrap(DEFAULT_SITE_THEMES), {
    document: { documentElement: root },
    matchMedia: () => ({ matches: true }),
    localStorage: {
      getItem: () => {
        throw new Error('denied');
      },
    },
  });
  expect(root.dataset.theme).toBe('TechDark');
});
