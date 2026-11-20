'use client';
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { useServerInsertedHTML } from 'next/navigation';
import {
  SITE_THEMES,
  SITE_THEME_STORAGE_KEY,
  parseVisitorTheme,
  resolveVisitorTheme,
  themeBootstrap,
  type SiteTheme,
  type VisitorTheme,
} from '@/lib/site-theme';
import {
  applySavedThemeColors,
  resolveMode,
  type CustomColors,
  type ThemeMode,
} from '@/lib/theme';
function subscribeSystem(listener: () => void) {
  const media = matchMedia('(prefers-color-scheme: dark)');
  media.addEventListener('change', listener);
  return () => media.removeEventListener('change', listener);
}
const getSystemDark = () => matchMedia('(prefers-color-scheme: dark)').matches;
const ThemeContext = createContext<{
  siteThemes: readonly SiteTheme[];
  siteTheme: SiteTheme;
  preference: VisitorTheme;
  canToggleMode: boolean;
  setTheme: (theme: VisitorTheme['choice']) => void;
  previewTheme: (theme: SiteTheme) => void;
  setMode: (mode: ThemeMode) => void;
  setColors: (colors: CustomColors) => void;
} | null>(null);
function applyTheme(preference: VisitorTheme) {
  const dark = matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.dataset.theme = resolveVisitorTheme(
    preference,
    dark,
  );
  applySavedThemeColors(
    preference.colors,
    preference.choice === 'custom'
      ? resolveMode(preference.mode, dark)
      : undefined,
  );
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute(
      'content',
      getComputedStyle(document.documentElement)
        .getPropertyValue('--color-base-100')
        .trim(),
    );
  document
    .querySelectorAll<HTMLLinkElement>('link[rel="icon"]')
    .forEach((link) => {
      if (!link.href.endsWith('/favicons/navy.svg'))
        link.href = '/favicons/navy.svg';
      link.type = 'image/svg+xml';
      link.sizes.value = 'any';
    });
}
export function ThemeProvider({
  children,
  siteThemes,
}: {
  children: ReactNode;
  siteThemes: SiteTheme[];
}) {
  const inserted = useRef(false);
  useServerInsertedHTML(() => {
    if (inserted.current) return null;
    inserted.current = true;
    return (
      <script
        id="store-theme-bootstrap"
        dangerouslySetInnerHTML={{ __html: themeBootstrap(siteThemes) }}
      />
    );
  });
  const [preference, setPreference] = useState<VisitorTheme>(() =>
    parseVisitorTheme(null, siteThemes),
  );
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const signature = siteThemes.join(',');
  useEffect(() => {
    const read = () => {
      let saved = null;
      try {
        saved = localStorage.getItem(SITE_THEME_STORAGE_KEY);
      } catch {}
      const next = parseVisitorTheme(
        saved,
        signature.split(',') as SiteTheme[],
      );
      setPreference(next);
      applyTheme(next);
    };
    const sync = (event: StorageEvent) => {
      if (event.key === SITE_THEME_STORAGE_KEY || event.key === null) read();
    };
    read();
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, [signature]);
  useEffect(() => {
    const media = matchMedia('(prefers-color-scheme: dark)');
    const update = () => applyTheme(preference);
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.head, { childList: true });
    media.addEventListener('change', update);
    return () => {
      observer.disconnect();
      media.removeEventListener('change', update);
    };
  }, [preference]);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
      delete document.documentElement.dataset.themeChanging;
    },
    [],
  );
  function change(next: VisitorTheme, animate = false) {
    if (timer.current) clearTimeout(timer.current);
    delete document.documentElement.dataset.themeChanging;
    if (animate && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.documentElement.dataset.themeChanging = 'true';
      void getComputedStyle(document.documentElement).getPropertyValue(
        '--color-base-100',
      );
      timer.current = setTimeout(() => {
        delete document.documentElement.dataset.themeChanging;
        timer.current = null;
      }, 1000);
    }
    setPreference(next);
    applyTheme(next);
    try {
      localStorage.setItem(SITE_THEME_STORAGE_KEY, JSON.stringify(next));
    } catch {}
  }
  function select(choice: VisitorTheme['choice']) {
    change({
      ...preference,
      choice,
      mode:
        choice === 'brand' || choice === 'custom'
          ? preference.mode
          : SITE_THEMES[choice],
    });
  }
  const systemDark = useSyncExternalStore(
    subscribeSystem,
    getSystemDark,
    () => false,
  );
  const siteTheme = resolveVisitorTheme(preference, systemDark);
  return (
    <ThemeContext.Provider
      value={{
        siteThemes,
        siteTheme,
        preference,
        canToggleMode: true,
        setTheme: (choice) => {
          if (
            choice === 'brand' ||
            choice === 'custom' ||
            siteThemes.includes(choice)
          )
            select(choice);
        },
        previewTheme: select,
        setColors: (colors) =>
          change({ ...preference, choice: 'custom', colors }),
        setMode: (mode) => change({ ...preference, mode }, true),
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}
export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useTheme must be used within ThemeProvider');
  return value;
}
