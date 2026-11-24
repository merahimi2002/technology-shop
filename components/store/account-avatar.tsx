'use client';
import { UserRound } from 'lucide-react';
import { ImagePreview } from '@/components/ui/image-preview';
export function AccountAvatar({
  name,
  image,
  size,
}: {
  name?: string | null;
  image?: string | null;
  size: number;
}) {
  const initial = name?.trim().match(/^./u)?.[0].toUpperCase();
  return (
    <span aria-hidden="true" className="block size-full">
      <ImagePreview
        image={image}
        size={size}
        round
        fallback={
          <span
            data-avatar-fallback
            className="text-primary-content motion-safe:transition-colors motion-safe:duration-1000"
          >
            {initial || (
              <UserRound size={size === 32 ? 18 : 26} strokeWidth={1.7} />
            )}
          </span>
        }
      />
    </span>
  );
}
