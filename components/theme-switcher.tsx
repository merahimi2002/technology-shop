'use client';
import { useTranslations } from 'next-intl';
import { Check, RotateCcw } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';
import { SITE_THEMES, type VisitorTheme } from '@/lib/site-theme';
import { DEFAULT_CUSTOM_COLORS } from '@/lib/theme';
import { useSystemDark } from '@/components/theme-toggle';
import { resolveMode } from '@/lib/theme';
export function ThemeSwitcher() {
  const t = useTranslations();
  const { siteThemes, preference, setTheme, setColors } = useTheme();
  const mode = resolveMode(preference.mode, useSystemDark());
  const choices: VisitorTheme['choice'][] = ['brand', ...siteThemes, 'custom'];
  return (
    <>
      <fieldset className="mt-4 grid grid-cols-2 gap-3">
        <legend className="sr-only">{t('theme.paletteLabel')}</legend>
        {choices.map((choice) => {
          const base = mode === 'dark' ? 'TechDark' : 'TechLight';
          const preview =
            choice === 'custom'
              ? 'TechDark'
              : choice === 'brand'
                ? base
                : choice;
          const label =
            choice === 'brand'
              ? t('siteSettings.brandTheme')
              : choice === 'custom'
                ? t('theme.palettes.custom')
                : t(`siteSettings.themeNames.${choice}`);
          return (
            <label
              key={choice}
              data-theme={preview}
              className="palette-card card cursor-pointer gap-3 border border-base-300 bg-base-100 p-3 text-base-content has-checked:outline-2 has-checked:outline-secondary has-checked:outline-offset-2 has-focus-visible:outline-3"
            >
              <input
                className="sr-only"
                type="radio"
                name="store-palette"
                value={choice}
                checked={preference.choice === choice}
                onChange={() => setTheme(choice)}
                aria-label={label}
              />
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-xs font-semibold">{label}</span>
                <span
                  className={`grid size-4 shrink-0 place-items-center rounded-full ${preference.choice === choice ? 'bg-secondary text-secondary-content' : 'border border-base-content/30'}`}
                >
                  {preference.choice === choice && (
                    <Check size={12} aria-hidden="true" />
                  )}
                </span>
              </div>
              <div aria-hidden="true" className="rounded-box bg-base-200 p-2">
                <div className="mb-2 h-1.5 w-2/3 rounded bg-base-content/35" />
                <div className="flex gap-1">
                  <span className="h-5 flex-1 rounded bg-primary" />
                  <span className="h-5 flex-1 rounded bg-secondary" />
                  <span className="h-5 flex-1 rounded bg-accent" />
                </div>
              </div>
              <span className="text-xs">
                {t(`siteSettings.${SITE_THEMES[preview]}`)}
              </span>
            </label>
          );
        })}
      </fieldset>
      {preference.choice === 'custom' && (
        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-2">
            {(['light', 'dark'] as const).map((displayMode) => (
              <fieldset
                key={displayMode}
                className="grid min-w-0 flex-1 grid-cols-2 justify-center gap-2 rounded-xl bg-base-200 p-2"
              >
                <legend className="px-1 text-xs font-semibold">
                  {t(`theme.modes.${displayMode}`)}
                </legend>
                {(['primary', 'secondary'] as const).map((key) => (
                  <label
                    key={key}
                    className="flex flex-col items-center gap-1 text-xs"
                  >
                    <input
                      type="color"
                      aria-label={t(`theme.colorLabels.${displayMode}.${key}`)}
                      className="size-9 cursor-pointer appearance-none overflow-hidden rounded-lg border-0 bg-transparent p-0 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-lg [&::-webkit-color-swatch]:border-0"
                      value={preference.colors[displayMode][key]}
                      onInput={(event) =>
                        setColors({
                          ...preference.colors,
                          [displayMode]: {
                            ...preference.colors[displayMode],
                            [key]: event.currentTarget.value,
                          },
                        })
                      }
                    />
                    {t(`theme.colors.${key}`)}
                  </label>
                ))}
              </fieldset>
            ))}
            <button
              type="button"
              className="btn btn-ghost btn-circle btn-sm"
              aria-label={t('theme.resetColors')}
              title={t('theme.resetColors')}
              onClick={() => setColors(DEFAULT_CUSTOM_COLORS)}
            >
              <RotateCcw size={17} aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
