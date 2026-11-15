'use client';

import { useTranslations } from 'next-intl';

export function AdminIntro() {
  const t = useTranslations('account');
  return (
    <>
      <h1 data-locale-motion className="card-title self-start">
        {t('adminPanel')}
      </h1>
      <p>{t('adminLanding')}</p>
    </>
  );
}
