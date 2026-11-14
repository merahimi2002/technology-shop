'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Check, Pencil, Trash2, X } from 'lucide-react';
import {
  AVATAR_FILE_TYPES,
  isValidAvatarFile,
  readAvatarCrop,
} from '@/lib/auth/avatar';
import { AccountAvatar } from '@/components/store/account-avatar';
import { Title } from '@/components/title';
import { ModalCloseButton } from '@/components/modal-close-button';
import { AvatarCrop } from './avatar-crop';
import { createPortal } from 'react-dom';

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
  const t = useTranslations('account');
  const locale = useLocale();
  const [removePhoto, setRemovePhoto] = useState(false);
  const [preview, setPreview] = useState<string>();
  const [photoError, setPhotoError] = useState(false);
  const [photoEditorOpen, setPhotoEditorOpen] = useState(false);
  const [cropTarget, setCropTarget] = useState<HTMLDivElement | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const effectiveImage =
    avatar === undefined
      ? image
      : avatar
        ? `data:image/png;base64,${avatar}`
        : null;
  const cropSource = photoError
    ? undefined
    : (preview ??
      (effectiveImage?.startsWith('/api/account/avatar?') ||
      effectiveImage?.startsWith('data:image/png;')
        ? effectiveImage
        : undefined));
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  return (
    <>
      {previewTarget &&
        createPortal(
          <div className="flex flex-col items-center gap-2">
            <div className="flex gap-1">
              <button
                type="button"
                className="btn btn-circle btn-soft btn-primary btn-sm"
                aria-label={t('profile.editPhoto')}
                title={t('profile.editPhoto')}
                disabled={busy}
                onClick={() => {
                  dialog.current?.showModal();
                  setPhotoEditorOpen(true);
                }}
              >
                <Pencil className="size-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                className="btn btn-circle btn-soft btn-error btn-sm"
                aria-label={t(
                  removePhoto
                    ? 'profile.undoRemovePhoto'
                    : 'profile.removePhoto',
                )}
                title={t(
                  removePhoto
                    ? 'profile.undoRemovePhoto'
                    : 'profile.removePhoto',
                )}
                disabled={busy || (!effectiveImage && !removePhoto)}
                onClick={() => {
                  setAvatar(removePhoto ? undefined : null);
                  setRemovePhoto(!removePhoto && Boolean(image));
                }}
              >
                {removePhoto ? (
                  <X className="size-4" aria-hidden="true" />
                ) : (
                  <Trash2 className="size-4" aria-hidden="true" />
                )}
              </button>
            </div>
            <div className="avatar size-16 text-xl sm:size-24">
              <AccountAvatar
                key={effectiveImage}
                name={name}
                image={effectiveImage}
                size={96}
              />
            </div>
          </div>,
          previewTarget,
        )}
      {previewTarget &&
        createPortal(
          <dialog
            ref={dialog}
            dir={locale === 'fa' ? 'rtl' : 'ltr'}
            className="modal"
            aria-labelledby={titleId}
            onSubmit={(event) => event.stopPropagation()}
            onClose={() => {
              setPhotoEditorOpen(false);
              setPreview(undefined);
              setPhotoError(false);
              const input =
                dialog.current?.querySelector<HTMLInputElement>(
                  'input[type=file]',
                );
              if (input) input.value = '';
            }}
          >
            <div className="modal-box max-w-md text-start">
              <div className="flex items-center justify-between gap-3">
                <Title id={titleId}>{t('profile.editPhoto')}</Title>
                <ModalCloseButton label={t('profile.cancel')} />
              </div>
              <div className="mt-4 flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div
                    ref={setCropTarget}
                    className="size-16 shrink-0 sm:size-24"
                  >
                    {(!photoEditorOpen || !cropSource) && (
                      <AccountAvatar
                        key={effectiveImage}
                        name={name}
                        image={effectiveImage}
                        size={96}
                      />
                    )}
                  </div>
                  <label className="flex min-w-0 flex-1 flex-col gap-1.5 text-sm font-semibold">
                    {t(
                      imageOptional ? 'profile.optionalPhoto' : 'profile.photo',
                    )}
                    <input
                      type="file"
                      accept={AVATAR_FILE_TYPES.join(',')}
                      aria-invalid={photoError}
                      className="file-input file-input-sm w-full rounded-full font-normal"
                      onChange={(event) => {
                        const file = event.currentTarget.files?.[0];
                        const valid = file && isValidAvatarFile(file);
                        setPhotoError(Boolean(file && !valid));
                        setPreview(
                          valid ? URL.createObjectURL(file) : undefined,
                        );
                      }}
                    />
                    <span className="font-normal text-base-content/70">
                      {t('profile.photoHint')}
                    </span>
                  </label>
                </div>
                {photoError && (
                  <p role="alert" className="text-sm text-error">
                    {t('profile.invalidAvatar')}
                  </p>
                )}
                {photoEditorOpen && cropSource && (
                  <AvatarCrop
                    key={cropSource}
                    src={cropSource}
                    previewTarget={cropTarget}
                  />
                )}
                <button
                  type="button"
                  className="btn btn-success w-fit self-center rounded-full"
                  disabled={!cropSource}
                  onClick={() => {
                    const crop = readAvatarCrop(cropTarget);
                    if (!crop) return;
                    setAvatar(crop);
                    setRemovePhoto(false);
                    dialog.current?.close();
                  }}
                >
                  <Check className="size-4" aria-hidden="true" />
                  {t('profile.save')}
                </button>
              </div>
            </div>
          </dialog>,
          previewTarget,
        )}
    </>
  );
}
