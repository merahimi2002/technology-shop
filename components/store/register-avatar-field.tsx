'use client';

import { useState } from 'react';
import { ProfilePhotoEditor } from './profile-photo-editor';

export function RegisterAvatarField({
  previewTarget,
  busy,
}: {
  previewTarget: HTMLElement | null;
  busy: boolean;
}) {
  const [avatar, setAvatar] = useState<string | null>();
  return (
    <>
      <input type="hidden" name="avatar" value={avatar ?? ''} />
      <ProfilePhotoEditor
        avatar={avatar}
        setAvatar={setAvatar}
        previewTarget={previewTarget}
        busy={busy}
        imageOptional
      />
    </>
  );
}
