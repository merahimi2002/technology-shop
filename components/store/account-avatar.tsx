'use client';

import Image from 'next/image';
import { useState } from 'react';
import { UserRound } from 'lucide-react';

export function AccountAvatar({
  name,
  image,
  size,
}: {
  name?: string | null;
  image?: string | null;
  size: number;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const initial = name?.trim().match(/^./u)?.[0].toUpperCase();

  return (
    <span
      aria-hidden="true"
      className="grid size-full place-items-center overflow-hidden rounded-full bg-linear-to-br from-primary to-secondary font-semibold text-primary-content"
    >
      {image && !imageFailed ? (
        <Image
          src={image}
          alt=""
          width={size}
          height={size}
          unoptimized
          className="size-full object-cover"
          onError={() => setImageFailed(true)}
        />
      ) : (
        initial || <UserRound size={size === 32 ? 18 : 26} strokeWidth={1.7} />
      )}
    </span>
  );
}
