'use client';

import { GradientButton } from '@/components/gradient-button';
import { Plus } from 'lucide-react';
import { useLocale } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { LayoutDashboard } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Title } from '@/components/title';
import { Subtitle } from '@/components/subtitle';

export function AdminPageFrame({
  page,
  children,
}: {
  page: 'users' | 'theme' | 'products' | 'categories';
  children: ReactNode;
}) {
  const t = useTranslations();
  const pathname = usePathname();
  const editing = useSearchParams().has('edit');
  const locale = useLocale();
  const catalogList =
    (page === 'categories' || page === 'products') &&
    pathname === `/${locale}/admin/${page}`;
  const headingKey =
    page === 'categories'
      ? pathname.endsWith('/categories/new')
        ? editing
          ? 'adminProducts.editCategory'
          : 'adminProducts.newCategory'
        : 'adminProducts.categories'
      : pathname.endsWith('/products/new')
        ? 'adminProducts.newProduct'
        : /\/products\/[^/]+$/.test(pathname)
          ? 'adminProducts.editPage'
          : 'adminProducts.heading';
  const users = page === 'users';
  const products = page === 'products' || page === 'categories';
  return (
    <main className="w-full min-w-0 flex-1 px-4 py-4 sm:px-6 lg:p-0">
      <section
        aria-label={t(
          products
            ? headingKey
            : users
              ? 'admin.heading'
              : 'siteSettings.theme',
        )}
        className="glass-header min-w-0 overflow-hidden rounded-[20px]"
      >
        <div
          data-admin-page-heading
          data-locale-motion
          className="border-b border-base-content/10 px-4 pt-5 pb-5 sm:px-5"
        >
          <Subtitle icon={<LayoutDashboard />} className="mb-1">
            {t(
              products
                ? 'adminProducts.subtitle'
                : users
                  ? 'admin.pageSubtitle'
                  : 'siteSettings.title',
            )}
          </Subtitle>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Title as="h1">
              {t(
                products
                  ? headingKey
                  : users
                    ? 'admin.pageTitle'
                    : 'siteSettings.theme',
              )}
            </Title>
            {catalogList && (
              <GradientButton href={`/${locale}/admin/${page}/new`}>
                <Plus size={18} aria-hidden="true" />
                {t(
                  page === 'categories'
                    ? 'adminProducts.newCategory'
                    : 'adminProducts.newProduct',
                )}
              </GradientButton>
            )}
          </div>
          {page === 'theme' && (
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
