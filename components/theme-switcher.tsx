'use client';

import { Check } from 'lucide-react';
import { Logo } from '@/components/logo';
import { useSystemDark } from '@/components/theme-toggle';
import { useTheme } from '@/components/theme-provider';
import { PALETTES, resolveMode, type Palette } from '@/lib/theme';

export function ThemeSwitcher() {
  const { preference, setPalette } = useTheme();
  const mode = resolveMode(preference.mode, useSystemDark());

  return (
    <fieldset className="mt-6 grid gap-3 sm:grid-cols-3">
      <legend className="sr-only">انتخاب رنگ‌بندی فروشگاه</legend>
      {Object.entries(PALETTES).map(([id, palette]) => (
        <label key={id} className="palette-card" data-theme={palette[mode]}>
          <input
            type="radio"
            name="store-palette"
            className="sr-only"
            value={id}
            checked={preference.palette === id}
            onChange={() => setPalette(id as Palette)}
            aria-label={palette.label}
          />
          <div className="palette-preview" aria-hidden="true">
            <div className="flex items-center justify-between border-b border-base-300 bg-base-100 px-3 py-1">
              <Logo
                primaryColor="var(--color-primary)"
                secondaryColor="var(--color-secondary)"
                width={30}
                height={30}
              />
              <span className="h-1 w-10 rounded-full bg-base-content/15" />
            </div>
            <div className="space-y-2 p-3">
              <span className="block h-1.5 w-3/4 rounded-full bg-base-content/65" />
              <span className="block h-1 w-1/2 rounded-full bg-base-content/20" />
              <div className="flex gap-1.5 pt-1">
                <span className="h-5 flex-1 rounded bg-primary" />
                <span className="h-5 flex-1 rounded bg-secondary" />
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between gap-2 px-3 py-3">
            <span className="text-xs font-medium">{palette.label}</span>
            <span
              className={`palette-check ${preference.palette === id ? 'bg-secondary text-secondary-content' : 'border border-base-content/20'}`}
              aria-hidden="true"
            >
              {preference.palette === id && (
                <Check size={13} strokeWidth={2.5} />
              )}
            </span>
          </div>
        </label>
      ))}
    </fieldset>
  );
}
