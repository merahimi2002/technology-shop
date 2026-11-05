'use client';

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
  const { preference, setMode } = useTheme();
  const dark = resolveMode(preference.mode, useSystemDark()) === 'dark';
  return (
    <span className="inline-flex min-h-11 shrink-0 items-center px-1">
      <label
        className="toggle theme-toggle-control has-focus-visible:outline-2 has-focus-visible:outline-secondary has-focus-visible:outline-offset-4 "
        title={dark ? 'تغییر به حالت روشن' : 'تغییر به حالت تیره'}
      >
        <input
          type="checkbox"
          value={PALETTES[preference.palette].dark}
          className="theme-controller"
          checked={dark}
          onChange={(event) => setMode(event.target.checked ? 'dark' : 'light')}
          aria-label="حالت تیره"
        />
        <SunMedium size={17} strokeWidth={1.8} aria-hidden="true" />
        <MoonStar size={17} strokeWidth={1.8} aria-hidden="true" />
      </label>
    </span>
  );
}
