'use client';

import { useLayoutEffect, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import fa from '@/messages/fa.json';
import en from '@/messages/en.json';
import { finishLocaleMotion } from '@/lib/locale-motion';

export function LocaleProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const locale =
    pathname === '/en' || pathname.startsWith('/en/') ? 'en' : 'fa';
  useLayoutEffect(() => {
    document.title = (locale === 'en' ? en : fa).brand.name;
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === 'fa' ? 'rtl' : 'ltr';
    finishLocaleMotion();
  }, [locale]);
  return (
    <NextIntlClientProvider
      locale={locale}
      timeZone="UTC"
      messages={locale === 'en' ? en : fa}
    >
      {children}
    </NextIntlClientProvider>
  );
}
