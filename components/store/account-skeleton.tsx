'use client';

import { useTranslations } from 'next-intl';
import { UserRound } from 'lucide-react';
import { Subtitle } from '@/components/subtitle';
import { Title } from '@/components/title';

export function AccountSkeleton({
  showAdminLink = false,
}: {
  showAdminLink?: boolean;
}) {
  const t = useTranslations('account');
  return (
    <div
      role="status"
      className="w-full motion-reduce:[&_.skeleton]:animate-none"
      aria-busy="true"
    >
      <span className="sr-only">{t('loading')}</span>
      <div aria-hidden="true">
        <div className="flex min-w-0 items-center gap-3 text-start">
          <div className="skeleton size-16 shrink-0 rounded-full sm:size-24" />
          <div className="min-w-0">
            <Subtitle icon={<UserRound />} className="mb-1">
              {t('accountSubtitle')}
            </Subtitle>
            <Title as="h1">{t('title')}</Title>
          </div>
        </div>
        <div className="mt-5 flex flex-col gap-4">
          <div className="flex h-7 items-center gap-2">
            <div className="skeleton size-4 shrink-0" />
            <div className="skeleton h-5 w-32 max-w-full" />
          </div>
          <div className="flex h-6 items-center gap-2">
            <div className="skeleton size-4 shrink-0" />
            <div className="skeleton h-4 w-56 max-w-[calc(100%-1.5rem)]" />
          </div>
          <div className="flex h-6 items-center gap-2">
            <div className="skeleton size-4 shrink-0" />
            <div className="skeleton h-4 w-28 max-w-full" />
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {showAdminLink && (
              <div className="skeleton h-10 w-36 rounded-full" />
            )}
            <div className="skeleton h-10 w-24 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function AccountPageSkeleton() {
  return (
    <div className="relative grid rounded-[24px] [@media(max-width:1023px)]:rounded-[20px] md:grid-cols-2">
      <div className="glass-folder flex min-w-0 flex-col rounded-[inherit] pb-2 md:rounded-e-none">
        <div
          aria-hidden="true"
          className="grid h-11 shrink-0 grid-cols-2 items-center justify-items-center motion-reduce:[&_.skeleton]:animate-none"
        >
          <div className="skeleton h-4 w-24" />
          <div className="skeleton h-4 w-24" />
        </div>
        <div className="me-2 -mt-px flex min-h-[33.5rem] flex-col justify-center rounded-b-[24px] rounded-se-[24px] bg-white/30 px-5 py-6 backdrop-blur-[3px] sm:min-h-[36.5rem] sm:px-11 sm:py-8 md:px-9 lg:px-15 dark:bg-black/45">
          <AccountSkeleton />
        </div>
      </div>
      <div aria-hidden="true" className="min-h-28 md:min-h-36" />
    </div>
  );
}
