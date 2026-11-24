'use client';

import { useTranslations } from 'next-intl';

function FieldSkeleton({ multiline = false }: { multiline?: boolean }) {
  return (
    <div className="fieldset min-w-0">
      <div className="fieldset-legend">
        <span className="skeleton h-4 w-20" />
      </div>
      <div
        className={
          multiline
            ? 'skeleton h-20 rounded-field'
            : 'skeleton h-10 rounded-field'
        }
      />
    </div>
  );
}

export function ProductEditorSkeleton({
  variantCount = 1,
  imageCount = 0,
}: {
  variantCount?: number;
  imageCount?: number;
}) {
  const t = useTranslations('adminProducts');

  return (
    <div
      role="status"
      aria-busy="true"
      className="p-4 motion-reduce:[&_.skeleton]:animate-none sm:p-5"
    >
      <span className="sr-only">{t('loading')}</span>
      <div aria-hidden="true">
        <div className="mb-4">
          <div className="skeleton h-5 w-24" />
          <div className="skeleton my-2 h-5 w-64 max-w-full" />
          <div className="flex flex-wrap gap-3">
            {Array.from({ length: imageCount }, (_, index) => (
              <div
                key={index}
                className="grid justify-items-center gap-2 rounded-box border border-base-content/10 p-2"
              >
                <div className="skeleton h-6 w-full rounded-field" />
                <div className="flex gap-1">
                  <span className="skeleton size-8 rounded-full" />
                  <span className="skeleton size-8 rounded-full" />
                </div>
                <span className="skeleton size-16 rounded-box sm:size-24" />
              </div>
            ))}
            <div className="skeleton min-h-36 w-[5.125rem] rounded-box sm:min-h-44 sm:w-[7.125rem]" />
          </div>
        </div>
        <div className="grid gap-x-4 md:grid-cols-3">
          <FieldSkeleton />
          <FieldSkeleton />
          <FieldSkeleton />
        </div>
        <div className="grid gap-x-4 sm:grid-cols-2">
          <FieldSkeleton />
          <div className="fieldset min-w-0">
            <div className="fieldset-legend">
              <span className="skeleton h-4 w-20" />
            </div>
            <div className="flex min-h-10 flex-wrap items-center gap-x-4 gap-y-2">
              {Array.from({ length: 3 }, (_, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="skeleton size-5 rounded-full" />
                  <span className="skeleton h-3 w-12" />
                </div>
              ))}
            </div>
          </div>
        </div>
        <FieldSkeleton multiline />
        <FieldSkeleton multiline />
        <div className="skeleton mt-5 h-6 w-20" />
        <div className="my-2 flex h-6 items-center">
          <span className="skeleton h-3 w-96 max-w-full" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: variantCount }, (_, index) => (
            <fieldset
              key={index}
              className="rounded-box border border-base-content/10 bg-base-200/40 p-3"
            >
              <legend className="px-2">
                <span className="skeleton inline-block h-4 w-16" />
              </legend>
              <div className="grid gap-3 sm:grid-cols-3">
                {Array.from({ length: 5 }, (_, field) => (
                  <FieldSkeleton key={field} />
                ))}
                <div className="flex min-h-10 items-center gap-2 sm:mb-1 sm:self-end">
                  <span className="skeleton h-5 w-9 rounded-full" />
                  <span className="skeleton h-3 w-12" />
                </div>
              </div>
            </fieldset>
          ))}
        </div>
        <div className="skeleton mt-3 h-8 w-28 rounded-field" />
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <span className="skeleton h-10 w-24 rounded-full" />
          <span className="skeleton h-10 w-24 rounded-full" />
        </div>
      </div>
    </div>
  );
}
