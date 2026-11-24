'use client';
import Image from 'next/image';
import { useState, type ReactNode } from 'react';
import { NoImage } from './no-image';
import { cn } from '@/lib/utils';

export function ImagePreview({
  image,
  name,
  alt = '',
  size,
  round = false,
  fallback,
}: {
  image?: string | null;
  name?: string | null;
  alt?: string;
  size: number;
  round?: boolean;
  fallback?: ReactNode;
}) {
  const [failedSource, setFailedSource] = useState<string>();
  const initial = name?.trim().match(/^./u)?.[0].toUpperCase();
  return (
    <span
      className={cn(
        'grid size-full place-items-center overflow-hidden',
        round
          ? 'rounded-full bg-[linear-gradient(135deg,var(--color-primary),var(--color-secondary))] font-semibold'
          : 'rounded-box bg-base-200 text-base-content/50',
      )}
    >
      {image && failedSource !== image ? (
        <Image
          src={image}
          alt={alt}
          width={size}
          height={size}
          unoptimized
          className={cn('size-full', round ? 'object-cover' : 'object-contain')}
          onError={() => setFailedSource(image)}
        />
      ) : (
        (fallback ??
        (round ? (
          <span
            data-avatar-fallback
            className={
              round
                ? 'text-primary-content motion-safe:transition-colors motion-safe:duration-1000'
                : undefined
            }
          >
            {initial}
          </span>
        ) : (
          <NoImage size={size} />
        )))
      )}
    </span>
  );
}
