'use client';
import { useTranslations } from 'next-intl';

import { useSyncExternalStore } from 'react';
import { MoonStar, SunMedium } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';
import { PALETTES, resolveMode } from '@/lib/theme';

function subscribe(listener: () => void) {
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  media.addEventListener('change', listener);
  return () => media.removeEventListener('change', listener);
}
const systemDark = () =>
  window.matchMedia('(prefers-color-scheme: dark)').matches;

export function useSystemDark() {
  return useSyncExternalStore(subscribe, systemDark, () => false);
}

export function ThemeToggle() {
  const t = useTranslations();
  const { preference, setMode } = useTheme();
  const dark = resolveMode(preference.mode, useSystemDark()) === 'dark';
  return (
    <span className="inline-flex min-h-11 shrink-0 items-center ps-0.5 pe-2">
      <label
        className="toggle toggle-lg theme-toggle-control border-0 bg-[conic-gradient(from_90deg,var(--color-primary)_0%,var(--color-secondary)_50%,var(--color-primary)_100%)] before:bg-base-100 before:bg-none [&>svg]:size-full [&>svg]:p-1 [&>svg]:text-base-content has-focus-visible:outline-2 has-focus-visible:outline-secondary has-focus-visible:outline-offset-4"
        title={dark ? t('theme.switchToLight') : t('theme.switchToDark')}
      >
        <input
          type="checkbox"
          value={PALETTES[preference.palette].dark}
          className="theme-controller"
          checked={dark}
          onChange={(event) => setMode(event.target.checked ? 'dark' : 'light')}
          aria-label={t('theme.modes.dark')}
        />
        <SunMedium size={18} strokeWidth={1.8} aria-hidden="true" />
        <MoonStar size={18} strokeWidth={1.8} aria-hidden="true" />
      </label>
    </span>
  );
}
