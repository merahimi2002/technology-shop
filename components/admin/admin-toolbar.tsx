'use client';

import { useSkeletonPreview } from '@/components/dev-skeleton-preview';

import { Suspense, type ReactNode } from 'react';
import {
  FileText,
  Folder,
  FolderOpen,
  Search,
  Waves,
  Power,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import Form from 'next/form';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { AccountAvatar } from '@/components/store/account-avatar';
import { LanguageSwitcher } from '@/components/language-switcher';
import { ThemeToggle } from '@/components/theme-toggle';
import { GradientButton } from '@/components/gradient-button';

function CategoryEditorCrumb() {
  const t = useTranslations('adminProducts');
  const params = useSearchParams();

  return t(params.get('edit') ? 'editCategory' : 'newCategory');
}

function AdminBreadcrumbs({ pathname }: { pathname: string }) {
  const locale = useLocale();
  const t = useTranslations();
  const root = `/${locale}/admin`;
  const [section, child] = pathname
    .slice(root.length)
    .split('/')
    .filter(Boolean);
  const crumbs: Array<{ label: ReactNode; href?: string }> = [];

  switch (section) {
    case undefined:
      crumbs.push({ label: t('admin.dashboard') });
      break;
    case 'users':
      crumbs.push({ label: t('admin.heading') });
      break;
    case 'search':
      crumbs.push({ label: t('admin.globalSearch') });
      break;
    case 'products':
      crumbs.push({
        label: t('adminProducts.heading'),
        href: `${root}/products`,
      });
      if (child) {
        crumbs.push({
          label: t(
            child === 'new'
              ? 'adminProducts.newProduct'
              : 'adminProducts.editPage',
          ),
        });
      }
      break;
    case 'categories':
      crumbs.push({
        label: t('adminProducts.categories'),
        href: `${root}/categories`,
      });
      if (child === 'new') {
        crumbs.push({
          label: (
            <Suspense fallback={t('adminProducts.newCategory')}>
              <CategoryEditorCrumb />
            </Suspense>
          ),
        });
      }
      break;
    case 'settings':
      crumbs.push({ label: t('siteSettings.title') });
      if (child === 'theme') crumbs.push({ label: t('siteSettings.theme') });
      break;
  }

  return (
    <nav
      className="breadcrumbs min-w-0 overflow-visible py-0"
      aria-label={t('admin.breadcrumbs')}
    >
      <ol className="flex-wrap gap-y-1 whitespace-normal">
        {crumbs.map(({ label, href }, index) => {
          const current = index === crumbs.length - 1;
          const Icon = [Folder, FolderOpen][index] ?? FileText;
          const content = (
            <>
              <Icon size={16} className="shrink-0" aria-hidden="true" />
              <span className="min-w-0 wrap-anywhere">{label}</span>
            </>
          );
          return (
            <li
              key={href ?? index}
              className="min-w-0 max-w-full before:shrink-0"
            >
              {href && !current ? (
                <Link href={href} className="min-w-0">
                  {content}
                </Link>
              ) : (
                <span
                  className="min-w-0 cursor-default hover:no-underline"
                  aria-current={current ? 'page' : undefined}
                >
                  {content}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function AdminSearch({ showQuery }: { showQuery: boolean }) {
  const locale = useLocale();
  const t = useTranslations();
  const params = useSearchParams();
  const query = showQuery ? (params.get('q') ?? '') : '';
  const label = t('admin.globalSearch');

  return (
    <Form
      action={`/${locale}/admin/search`}
      role="search"
      aria-label={label}
      className="input w-full rounded-full bg-base-200/80"
    >
      <button
        type="submit"
        aria-label={label}
        className="btn btn-ghost btn-circle btn-xs shrink-0 text-primary"
      >
        <Search size={18} aria-hidden="true" />
      </button>
      <input
        key={query}
        type="search"
        name="q"
        dir={locale === 'fa' ? 'rtl' : 'ltr'}
        className="text-start"
        maxLength={120}
        required
        aria-label={label}
        placeholder={label}
        defaultValue={query}
      />
    </Form>
  );
}

export function AdminToolbar({
  menuButton,
  waves,
  onToggleWaves,
}: {
  menuButton: ReactNode;
  waves: boolean;
  onToggleWaves: () => void;
}) {
  const locale = useLocale();
  const pathname = usePathname();
  const t = useTranslations();
  const skeletonPreview = useSkeletonPreview();
  const { data: session, status } = useSession();
  const user = session?.user;
  const isAdmin = user?.role === 'OWNER' || user?.role === 'ADMIN';
  const WaveIcon = waves ? Waves : Power;

  return (
    <header
      data-locale-motion
      className="glass-header m-4 mb-0 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 rounded-[20px] px-3 py-3 sm:mx-6 sm:px-4 lg:m-0 lg:mb-4 lg:grid-cols-[auto_minmax(10rem,1fr)_auto] lg:rounded-[24px] xl:grid-cols-[minmax(0,1fr)_minmax(14rem,28rem)_minmax(0,1fr)]"
    >
      <div
        data-locale-motion
        className="flex min-w-0 items-center gap-2 text-sm font-semibold text-primary"
      >
        {menuButton}
        <AdminBreadcrumbs pathname={pathname} />
      </div>
      <div
        data-locale-motion
        className="col-span-2 row-start-2 min-h-10 lg:col-span-1 lg:row-start-auto"
      >
        <Suspense
          fallback={
            <div
              aria-hidden="true"
              className="skeleton h-10 rounded-full motion-reduce:animate-none"
            />
          }
        >
          <AdminSearch
            key={pathname}
            showQuery={pathname === `/${locale}/admin/search`}
          />
        </Suspense>
      </div>
      <div
        data-locale-motion
        className="flex min-w-0 items-center justify-end gap-1 sm:gap-2"
      >
        <div dir="ltr" className="flex shrink-0 items-center gap-1">
          <GradientButton
            type="button"
            aria-label={t('admin.waveBackground')}
            title={t('admin.waveBackground')}
            aria-pressed={waves}
            onClick={onToggleWaves}
            className="btn-circle h-6 min-h-6 w-6 shrink-0 gap-0 p-0"
          >
            <WaveIcon size={15} aria-hidden="true" />
          </GradientButton>
          <ThemeToggle />
        </div>
        <LanguageSwitcher />
        {(skeletonPreview || (status === 'loading' && !user)) && (
          <div
            role="status"
            aria-busy="true"
            className="flex items-center gap-2 motion-reduce:[&_.skeleton]:animate-none"
          >
            <span className="sr-only">{t('account.loading')}</span>
            <div
              aria-hidden="true"
              className="skeleton hidden h-8 w-24 sm:block"
            />
            <div aria-hidden="true" className="skeleton size-9 rounded-full" />
          </div>
        )}
        {!skeletonPreview && isAdmin && (
          <Link
            href={`/${locale}/account`}
            aria-label={t('account.title')}
            className="flex min-w-0 items-center gap-2 rounded-full ps-1.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <span className="hidden min-w-0 max-w-28 text-end sm:block">
              <span className="block truncate text-sm font-semibold" dir="auto">
                {user.name || t('account.title')}
              </span>
              <span className="block text-xs text-base-content/70">
                {t(`account.roles.${user.role}`)}
              </span>
            </span>
            <span className="avatar avatar-online size-9 shrink-0">
              <AccountAvatar
                key={user.image}
                name={user.name}
                image={user.image}
                size={36}
              />
            </span>
          </Link>
        )}
      </div>
    </header>
  );
}
