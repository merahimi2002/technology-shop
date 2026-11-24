'use client';

import { useTranslations } from 'next-intl';

export const categoryEditorGrid =
  'grid gap-4 sm:grid-cols-[repeat(2,minmax(0,18rem))] xl:grid-cols-[repeat(3,minmax(0,18rem))]';

export function CategoryEditorSkeleton() {
  const t = useTranslations('adminProducts');
  return (
    <div
      role="status"
      aria-busy="true"
      className="p-4 motion-reduce:[&_.skeleton]:animate-none sm:p-5"
    >
      <span className="sr-only">{t('loadingCategoryEditor')}</span>
      <div aria-hidden="true">
        <div className={categoryEditorGrid}>
          {['nameFa', 'nameEn', 'slug'].map((key) => (
            <div className="fieldset min-w-0" key={key}>
              <div className="fieldset-legend">
                <span className="skeleton h-4 w-24" />
              </div>
              <div className="skeleton h-10 w-full rounded-field" />
            </div>
          ))}
          <div className="sm:col-span-2 xl:col-span-3">
            <div className="mb-3 flex h-5 items-center">
              <span className="skeleton h-4 w-24" />
            </div>
            <div className="flex w-fit flex-col items-center gap-2">
              <div className="flex gap-1">
                <span className="skeleton size-8 rounded-full" />
                <span className="skeleton size-8 rounded-full" />
              </div>
              <div className="skeleton size-16 rounded-box sm:size-24" />
            </div>
            <div className="mt-2 flex h-6 items-center">
              <span className="skeleton h-3 w-96 max-w-full" />
            </div>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <span className="skeleton h-10 w-24 rounded-full" />
          <span className="skeleton h-10 w-20 rounded-full" />
        </div>
      </div>
    </div>
  );
}
