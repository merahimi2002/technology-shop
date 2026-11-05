'use client';

import { useRef, type MouseEvent } from 'react';
import { flushSync } from 'react-dom';
import { useLocale, useTranslations } from 'next-intl';
import { LanguageFlag } from '@/components/language-flag';
import { prepareLocaleMotion } from '@/lib/locale-motion';

export function LanguageSwitcher() {
  const locale = useLocale();
  const t = useTranslations('language');
  const changing = useRef(false);
  const target = locale === 'en' ? '/' : '/en';
  async function changeLanguage(event: MouseEvent<HTMLAnchorElement>) {
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    event.preventDefault();
    if (changing.current) return;
    changing.current = true;
    const reduced =
      event.detail === 0 ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    try {
      const finished = prepareLocaleMotion(reduced);
      flushSync(() => window.history.pushState(null, '', target));
      await finished;
    } finally {
      changing.current = false;
    }
  }
  return (
    <a
      href={target}
      hrefLang={locale === 'en' ? 'fa' : 'en'}
      onClick={changeLanguage}
      className="btn btn-ghost btn-circle h-8 min-h-8 w-8 p-1"
      aria-label={locale === 'en' ? t('switchToPersian') : t('switchToEnglish')}
    >
      <LanguageFlag locale={locale === 'en' ? 'fa' : 'en'} />
    </a>
  );
}
