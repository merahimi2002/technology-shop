'use client';
import { useRef, useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { Palette, RotateCcw } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';
import { ADMIN_THEMES, type SiteTheme } from '@/lib/site-theme';
import { saveSiteThemes } from '@/app/[locale]/admin/settings/theme/actions';
export function ThemeSettings({
  current,
  loading = false,
}: {
  current: SiteTheme[];
  loading?: boolean;
}) {
  const t = useTranslations('siteSettings');
  const { siteTheme, siteThemes, previewTheme, setTheme } = useTheme();
  const [themes, setThemes] = useState(loading ? [...siteThemes] : current);
  const saved = useRef(current);
  const [mode, setMode] = useState<'all' | 'light' | 'dark'>('all');
  const [result, setResult] = useState<'saved' | 'error' | null>(null);
  const [pending, startTransition] = useTransition();
  function choose(name: SiteTheme) {
    if (pending || loading) return;
    previewTheme(name);
    const selected = themes.includes(name);
    const next = selected
      ? themes.filter((theme) => theme !== name)
      : [...(themes.length === 4 ? themes.slice(1) : themes), name];
    setThemes(next);
    setResult(null);
    if (next.length !== 4) return;
    startTransition(async () => {
      try {
        const status = await saveSiteThemes(next);
        setResult(status);
        if (status === 'saved') saved.current = next;
        else setThemes(saved.current);
      } catch {
        setResult('error');
        setThemes(saved.current);
      }
    });
  }
  const ordered = [
    ...themes,
    ...Object.keys(ADMIN_THEMES).filter(
      (name) => !themes.includes(name as SiteTheme),
    ),
  ] as SiteTheme[];
  const visible = ordered.filter(
    (name) =>
      mode === 'all' ||
      mode === ADMIN_THEMES[name as keyof typeof ADMIN_THEMES],
  );
  return (
    <div aria-busy={loading}>
      <div
        inert={loading}
        className="flex flex-wrap items-center gap-x-4 gap-y-3 border-b border-base-content/10 px-4 py-4 sm:px-5"
      >
        <div role="group" aria-label={t('filter')} className="flex gap-2">
          {(['all', 'light', 'dark'] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setMode(value)}
              aria-pressed={mode === value}
              className={`btn btn-sm ${mode === value ? 'btn-primary' : 'btn-soft btn-primary'}`}
            >
              {t(value)}
            </button>
          ))}
        </div>
        <div
          aria-hidden="true"
          className="divider divider-horizontal divider-secondary mx-0 my-0 self-stretch"
        />
        <span className="flex items-center gap-2 text-sm text-base-content/65">
          <Palette size={16} className="text-primary" aria-hidden="true" />
          {t('total', { count: visible.length })}
        </span>
        <button
          type="button"
          onClick={() => setTheme('brand')}
          className="btn btn-soft btn-primary btn-sm"
        >
          <RotateCcw size={15} aria-hidden="true" />
          {t('brandTheme')}
        </button>
        <span
          role="status"
          aria-live="polite"
          aria-label={t('selectedCount', { count: themes.length })}
          className="ms-auto flex items-center gap-2 text-sm font-semibold tabular-nums text-base-content/65"
        >
          {pending && (
            <>
              <span
                className="loading loading-spinner loading-xs"
                aria-hidden="true"
              />
              <span className="sr-only">{t('saving')}</span>
            </>
          )}
          <span dir="ltr">{`${String(themes.length).padStart(2, '0')}/04`}</span>
        </span>
      </div>
      {result === 'error' && (
        <p role="alert" className="px-4 pt-3 text-sm text-error sm:px-5">
          {t('error')}
        </p>
      )}
      <fieldset
        disabled={pending || loading}
        className="grid grid-cols-2 gap-3 p-4 [overflow-anchor:none] sm:grid-cols-3 sm:p-5 lg:grid-cols-4 xl:grid-cols-6"
      >
        <legend className="sr-only">{t('availableThemes')}</legend>
        {visible.map((name) => {
          const selected = themes.includes(name);
          return (
            <label
              key={name}
              data-theme={loading ? undefined : name}
              className={`card min-w-0 cursor-pointer gap-3 border bg-base-100 p-3 text-start text-base-content has-disabled:cursor-wait transition-opacity duration-250 ease-out motion-reduce:transition-none has-focus-visible:outline-3 has-focus-visible:outline-primary has-focus-visible:outline-offset-2 ${selected ? 'border-primary outline-1 outline-primary opacity-100' : 'border-base-300 opacity-60 hover:border-primary/60 has-focus-visible:opacity-100 [@media(hover:hover)_and_(pointer:fine)]:hover:opacity-100'}`}
            >
              <div className="flex min-w-0 items-center justify-between gap-2">
                <span
                  className="truncate text-xs font-semibold"
                  title={t(`themeNames.${name}`)}
                >
                  {t(`themeNames.${name}`)}
                </span>
                <input
                  type="checkbox"
                  name="admin-themes"
                  value={name}
                  checked={selected}
                  onChange={() => choose(name)}
                  aria-label={t('selectTheme', {
                    theme: t(`themeNames.${name}`),
                  })}
                  className="radio radio-primary radio-sm shrink-0"
                />
              </div>
              <div
                aria-hidden="true"
                className={`rounded-box bg-base-200 p-2 ${loading ? 'skeleton [&>*]:invisible motion-reduce:animate-none' : ''}`}
              >
                <div className="mb-2 h-1.5 w-2/3 rounded bg-base-content/40" />
                <div className="mb-3 h-1 w-1/2 rounded bg-base-content/15" />
                <div className="flex gap-1">
                  <span className="h-6 flex-1 rounded-field bg-primary" />
                  <span className="h-6 flex-1 rounded-field bg-secondary" />
                  <span className="h-6 flex-1 rounded-field bg-accent" />
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-1 text-[10px]">
                <span className="badge badge-soft badge-xs">
                  {t(ADMIN_THEMES[name as keyof typeof ADMIN_THEMES])}
                </span>
                {selected ? (
                  <span className="text-primary">{t('selected')}</span>
                ) : siteTheme === name ? (
                  <span className="text-primary">{t('active')}</span>
                ) : null}
              </div>
            </label>
          );
        })}
      </fieldset>
      {visible.length === 0 && (
        <p className="px-4 pb-10 text-center text-sm text-base-content/65">
          {t('empty')}
        </p>
      )}
    </div>
  );
}
