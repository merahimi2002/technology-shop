'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  type ReactNode,
} from 'react';
import {
  DEFAULT_THEME,
  DEFAULT_CUSTOM_COLORS,
  applyCustomColors,
  resolveMode,
  type CustomColors,
  THEME_STORAGE_KEY,
  parseTheme,
  resolveTheme,
  type Palette,
  type ThemeMode,
  type ThemePreference,
} from '@/lib/theme';

const ThemeContext = createContext<{
  preference: ThemePreference;
  setPalette: (palette: Palette) => void;
  setMode: (mode: ThemeMode) => void;
  setColors: (colors: CustomColors) => void;
} | null>(null);

function applyTheme(preference: ThemePreference) {
  const root = document.documentElement;
  root.dataset.theme = resolveTheme(
    preference,
    matchMedia('(prefers-color-scheme: dark)').matches,
  );
  if (preference.palette === 'custom') {
    applyCustomColors(
      root,
      preference.colors ?? DEFAULT_CUSTOM_COLORS,
      resolveMode(
        preference.mode,
        matchMedia('(prefers-color-scheme: dark)').matches,
      ),
    );
  } else root.removeAttribute('data-custom-palette');
  const background = getComputedStyle(root)
    .getPropertyValue('--color-base-100')
    .trim();
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', background);
  document
    .querySelectorAll<HTMLLinkElement>('link[rel="icon"]')
    .forEach((link) => {
      link.href = `/favicons/${preference.palette === 'custom' ? 'navy' : preference.palette}.svg`;
      link.type = 'image/svg+xml';
      link.sizes.value = 'any';
    });
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreference] = useState(DEFAULT_THEME);
  const [ready, setReady] = useState(false);
  const transitionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (transitionTimer.current) clearTimeout(transitionTimer.current);
      delete document.documentElement.dataset.themeChanging;
    },
    [],
  );

  useEffect(() => {
    const read = () => {
      let stored = null;
      try {
        stored = localStorage.getItem(THEME_STORAGE_KEY);
      } catch {
        /* Storage can be denied. */
      }
      setPreference(parseTheme(stored));
      setReady(true);
    };
    const sync = (event: StorageEvent) => {
      if (event.key === THEME_STORAGE_KEY || event.key === null) read();
    };
    read();
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const media = matchMedia('(prefers-color-scheme: dark)');
    const update = () => applyTheme(preference);
    update();
    // Next can append icon metadata after hydration or navigation.
    const observer = new MutationObserver(update);
    observer.observe(document.head, { childList: true });
    media.addEventListener('change', update);
    return () => {
      observer.disconnect();
      media.removeEventListener('change', update);
    };
  }, [preference, ready]);

  function update(next: ThemePreference) {
    setPreference(next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* Keep the in-memory choice. */
    }
  }

  function changeMode(mode: ThemeMode) {
    const root = document.documentElement;
    if (transitionTimer.current) clearTimeout(transitionTimer.current);
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      delete root.dataset.themeChanging;
    } else {
      root.dataset.themeChanging = 'true';
      // Commit the transition rule before changing the daisyUI theme values.
      void getComputedStyle(root).getPropertyValue('--color-base-100');
      transitionTimer.current = setTimeout(() => {
        delete root.dataset.themeChanging;
        document
          .querySelector('meta[name="theme-color"]')
          ?.setAttribute(
            'content',
            getComputedStyle(root).getPropertyValue('--color-base-100').trim(),
          );
        transitionTimer.current = null;
      }, 1000);
    }
    update({ ...preference, mode });
  }

  return (
    <ThemeContext.Provider
      value={{
        preference,
        setColors: (colors) =>
          update({ ...preference, palette: 'custom', colors }),
        setPalette: (palette) => update({ ...preference, palette }),
        setMode: changeMode,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const theme = useContext(ThemeContext);
  if (!theme) throw new Error('useTheme must be used within ThemeProvider');
  return theme;
}
