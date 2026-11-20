'use client';

import type { ReactNode } from 'react';
import { LayoutDashboard } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Title } from '@/components/title';
import { Subtitle } from '@/components/subtitle';

export function AdminPageFrame({
  page,
  children,
}: {
  page: 'users' | 'theme';
  children: ReactNode;
}) {
  const t = useTranslations();
  const users = page === 'users';
  return (
    <main className="w-full min-w-0 flex-1 px-4 py-4 sm:px-6 lg:p-0">
      <section
        aria-label={t(users ? 'admin.heading' : 'siteSettings.theme')}
        className="glass-header min-w-0 overflow-hidden rounded-[20px]"
      >
        <div
          data-admin-page-heading
          data-locale-motion
          className="border-b border-base-content/10 px-4 pt-5 pb-5 sm:px-5"
        >
          <Subtitle icon={<LayoutDashboard />} className="mb-1">
            {t(users ? 'admin.pageSubtitle' : 'siteSettings.title')}
          </Subtitle>
          <Title as="h1">
            {t(users ? 'admin.pageTitle' : 'siteSettings.theme')}
          </Title>
          {!users && (
            <p className="mt-3 text-sm leading-7 text-base-content/70">
              {t('siteSettings.description')}
            </p>
          )}
        </div>
        {children}
      </section>
    </main>
  );
}
