'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';

const SkeletonPreviewContext = createContext(false);

export function useSkeletonPreview() {
  const enabled = useContext(SkeletonPreviewContext);
  return process.env.NODE_ENV === 'development' && enabled;
}

export function DevSkeletonPreview({ children }: { children: ReactNode }) {
  const [enabled, setEnabled] = useState(false);
  const t = useTranslations('development');
  if (process.env.NODE_ENV !== 'development') return children;

  return (
    <SkeletonPreviewContext value={enabled}>
      {children}
      <button
        type="button"
        className={`btn btn-sm fixed end-4 bottom-16 z-[100] rounded-full shadow-lg ${enabled ? 'btn-warning' : 'btn-neutral'}`}
        aria-pressed={enabled}
        onClick={() => setEnabled((value) => !value)}
      >
        {t(enabled ? 'showContent' : 'showSkeleton')}
      </button>
    </SkeletonPreviewContext>
  );
}
