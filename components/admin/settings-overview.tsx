'use client';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
export function SettingsOverview() {
  const locale = useLocale();
  const t = useTranslations('siteSettings');
  return (
    <main className="p-4 sm:p-6">
      <h1 className="text-2xl font-bold">{t('title')}</h1>
      <Link
        href={`/${locale}/admin/settings/theme`}
        className="card mt-6 border border-base-300 bg-base-100 p-6 text-primary hover:bg-base-200"
      >
        {t('theme')}
      </Link>
    </main>
  );
}
