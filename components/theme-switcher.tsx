'use client';
import { useTranslations } from 'next-intl';

import type { CSSProperties } from 'react';
import { Check, RotateCcw } from 'lucide-react';
import { Logo } from '@/components/logo';
import { useSystemDark } from '@/components/theme-toggle';
import { useTheme } from '@/components/theme-provider';
import {
  PALETTES,
  DEFAULT_CUSTOM_COLORS,
  resolveMode,
  type Palette,
} from '@/lib/theme';

export function ThemeSwitcher() {
  const t = useTranslations();
  const { preference, setPalette, setColors } = useTheme();
  const mode = resolveMode(preference.mode, useSystemDark());

  return (
    <>
      <fieldset className="mt-4 grid grid-cols-2 gap-3">
        <legend className="sr-only">{t('theme.paletteLabel')}</legend>
        {Object.entries(PALETTES).map(([id, palette]) => (
          <label
            key={id}
            className="palette-card border border-base-300 has-checked:outline-2 has-checked:outline-secondary has-checked:outline-offset-2 has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-primary has-[:focus-visible]:outline-offset-3 block overflow-hidden min-w-0 rounded-[14px] bg-base-100 text-base-content cursor-pointer"
            data-theme={palette[mode]}
            data-custom-palette={id === 'custom' ? '' : undefined}
            style={
              id === 'custom'
                ? ({
                    '--custom-primary': (preference.colors ??
                      DEFAULT_CUSTOM_COLORS)[mode].primary,
                    '--custom-secondary': (preference.colors ??
                      DEFAULT_CUSTOM_COLORS)[mode].secondary,
                    '--custom-primary-content': '#ffffff',
                    '--custom-secondary-content': '#000000',
                  } as CSSProperties)
                : undefined
            }
          >
            <input
              type="radio"
              name="store-palette"
              className="sr-only"
              value={id}
              checked={preference.palette === id}
              onChange={() => setPalette(id as Palette)}
              aria-label={t(palette.labelKey)}
            />
            <div className="palette-preview bg-base-200" aria-hidden="true">
              <div className="flex items-center justify-between border-b border-base-300 bg-base-100 px-3 py-1">
                <Logo
                  label={t('brand.name')}
                  primaryColor="var(--color-primary)"
                  secondaryColor="var(--color-secondary)"
                  width={24}
                  height={24}
                />
                <span className="h-1 w-10 rounded-full bg-base-content/15" />
              </div>
              <div className="space-y-1.5 p-2">
                <span className="block h-1.5 w-3/4 rounded-full bg-base-content/65" />
                <span className="block h-1 w-1/2 rounded-full bg-base-content/20" />
                <div className="flex gap-1.5 pt-1">
                  <span className="h-5 flex-1 rounded bg-primary" />
                  <span className="h-5 flex-1 rounded bg-secondary" />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between gap-2 px-2 py-2">
              <span className="text-xs font-medium">{t(palette.labelKey)}</span>
              <span
                className={`palette-check inline-flex w-[18px] h-[18px] shrink-0 items-center justify-center rounded-full ${preference.palette === id ? 'bg-secondary text-secondary-content' : 'border border-base-content/20'}`}
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
      {preference.palette === 'custom' && (
        <div className="mt-4 space-y-3">
          <div className="flex w-full items-center gap-2">
            {(['light', 'dark'] as const).map((displayMode) => (
              <fieldset
                key={displayMode}
                className="grid min-w-0 flex-1 grid-cols-[repeat(2,max-content)] justify-center gap-1 rounded-xl bg-base-200 p-2"
              >
                <legend className="px-1 text-xs font-semibold">
                  {displayMode === 'light'
                    ? t('theme.modes.light')
                    : t('theme.modes.dark')}
                </legend>
                {(['primary', 'secondary'] as const).map((key) => (
                  <label
                    key={key}
                    className="flex min-w-0 flex-col items-center gap-1 whitespace-nowrap text-[11px]"
                  >
                    <input
                      type="color"
                      aria-label={t(`theme.colorLabels.${displayMode}.${key}`)}
                      className="size-10 cursor-pointer appearance-none overflow-hidden rounded-lg border-0 bg-transparent p-0 shadow-none [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-lg [&::-webkit-color-swatch]:border-0 [&::-webkit-color-swatch]:shadow-none [&::-moz-color-swatch]:rounded-lg [&::-moz-color-swatch]:border-0 [&::-moz-color-swatch]:shadow-none"
                      value={
                        (preference.colors ?? DEFAULT_CUSTOM_COLORS)[
                          displayMode
                        ][key]
                      }
                      onInput={(event) => {
                        const colors =
                          preference.colors ?? DEFAULT_CUSTOM_COLORS;
                        setColors({
                          ...colors,
                          [displayMode]: {
                            ...colors[displayMode],
                            [key]: event.currentTarget.value,
                          },
                        });
                      }}
                    />
                    {key === 'primary'
                      ? t('theme.colors.primary')
                      : t('theme.colors.secondary')}
                  </label>
                ))}
              </fieldset>
            ))}
            <button
              type="button"
              className="btn btn-ghost btn-circle h-8 min-h-8 w-8 border-0 bg-base-content/7 p-0 shadow-none [@media(hover:hover)_and_(pointer:fine)]:hover:bg-[conic-gradient(from_90deg,var(--color-primary)_0%,var(--color-secondary)_50%,var(--color-primary)_100%)] [@media(hover:hover)_and_(pointer:fine)]:hover:text-primary-content"
              aria-label={t('theme.resetColors')}
              title={t('theme.resetColors')}
              onClick={() => setColors(DEFAULT_CUSTOM_COLORS)}
            >
              <RotateCcw size={18} strokeWidth={1.7} aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
