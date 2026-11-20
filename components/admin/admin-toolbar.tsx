'use client';

import { useSkeletonPreview } from '@/components/dev-skeleton-preview';

import { Suspense, type ReactNode } from 'react';
import { FolderOpen, Search, Waves, Power } from 'lucide-react';
import { useSession } from 'next-auth/react';
import Form from 'next/form';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { AccountAvatar } from '@/components/store/account-avatar';
import { LanguageSwitcher } from '@/components/language-switcher';
import { ThemeToggle } from '@/components/theme-toggle';
import { GradientButton } from '@/components/gradient-button';

function UserSearch() {
  const locale = useLocale();
  const t = useTranslations('admin');
  const params = useSearchParams();
  const query = params.get('q') ?? '';

  return (
    <Form
      action={`/${locale}/admin/users`}
      scroll={false}
      role="search"
      aria-label={t('search')}
      className="input w-full rounded-full bg-base-200/80"
    >
      <button
        type="submit"
        aria-label={t('search')}
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
        aria-label={t('search')}
        placeholder={t('searchPlaceholder')}
        defaultValue={query}
      />
      <input type="hidden" name="role" value={params.get('role') ?? ''} />
      <input type="hidden" name="status" value={params.get('status') ?? ''} />
      <input type="hidden" name="sort" value={params.get('sort') ?? ''} />
      <input
        type="hidden"
        name="direction"
        value={params.get('direction') ?? ''}
      />
      <input
        type="hidden"
        name="pageSize"
        value={params.get('pageSize') ?? '20'}
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
        <FolderOpen
          size={18}
          className="hidden shrink-0 lg:block"
          aria-hidden="true"
        />
        <span className="truncate">
          {t(pathname.endsWith('/users') ? 'admin.heading' : 'admin.dashboard')}
        </span>
      </div>
      <div
        data-locale-motion
        className="col-span-2 row-start-2 lg:col-span-1 lg:row-start-auto"
      >
        <Suspense
          fallback={
            <div
              aria-hidden="true"
              className="skeleton h-10 rounded-full motion-reduce:animate-none"
            />
          }
        >
          <UserSearch />
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
