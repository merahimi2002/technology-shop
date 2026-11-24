'use client';
import { useTranslations } from 'next-intl';
import { ImageEditor } from '@/components/ui/image-editor';
export function ProfilePhotoEditor({
  avatar,
  setAvatar,
  name,
  image,
  previewTarget,
  busy = false,
  imageOptional = false,
}: {
  avatar?: string | null;
  setAvatar: (avatar?: string | null) => void;
  name?: string | null;
  image?: string | null;
  previewTarget: HTMLElement | null;
  busy?: boolean;
  imageOptional?: boolean;
}) {
  const t = useTranslations('account.profile');
  return (
    <ImageEditor
      value={avatar}
      onChange={setAvatar}
      name={name}
      image={image}
      previewTarget={previewTarget}
      busy={busy}
      round
      outputSize={160}
      fileLabel={t(imageOptional ? 'optionalPhoto' : 'photo')}
    />
  );
}
