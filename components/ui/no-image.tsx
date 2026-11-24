'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useTheme } from '@/components/theme-provider';
import { SITE_THEMES } from '@/lib/site-theme';

export function NoImage({ size }: { size: number }) {
  const t = useTranslations('imageEditor');
  const { siteTheme } = useTheme();
  const dark = SITE_THEMES[siteTheme] === 'dark';
  return (
    <Image
      src={dark ? '/images/no-image-dark.png' : '/images/no-image.png'}
      alt={t('noImage')}
      width={size}
      height={size}
      unoptimized
      className="size-full object-contain"
    />
  );
}
