'use client';
import { FormError } from './form-error';

import { useEffect, useId, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Check, Pencil, Trash2, X } from 'lucide-react';
import { IMAGE_FILE_TYPES, MAX_IMAGE_BYTES } from '@/lib/image-input';
import { ImagePreview } from '@/components/ui/image-preview';
import { Title } from '@/components/title';
import { ModalCloseButton } from '@/components/modal-close-button';
import { ImageCrop } from './image-crop';
import { createPortal } from 'react-dom';

export function ImageEditor({
  value,
  onChange,
  name,
  image,
  previewTarget,
  busy = false,
  fileLabel,
  round = false,
  outputSize = 640,
  accept = IMAGE_FILE_TYPES.join(','),
  maxBytes = MAX_IMAGE_BYTES,
}: {
  value?: string | null;
  onChange: (value?: string | null) => void;
  name?: string | null;
  image?: string | null;
  previewTarget?: HTMLElement | null;
  busy?: boolean;
  fileLabel?: string;
  round?: boolean;
  outputSize?: number;
  accept?: string;
  maxBytes?: number;
}) {
  const t = useTranslations('imageEditor');
  const locale = useLocale();
  const [removePhoto, setRemovePhoto] = useState(false);
  const [preview, setPreview] = useState<string>();
  const [photoError, setPhotoError] = useState(false);
  const [photoEditorOpen, setPhotoEditorOpen] = useState(false);
  const [cropReady, setCropReady] = useState(false);
  const [cropTarget, setCropTarget] = useState<HTMLDivElement | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const effectiveImage =
    value === undefined
      ? image
      : value
        ? `data:image/png;base64,${value}`
        : null;
  const cropSource = photoError
    ? undefined
    : (preview ??
      (effectiveImage?.startsWith('/api/') ||
      effectiveImage?.startsWith('data:image/png;')
        ? effectiveImage
        : undefined));
  useEffect(() => {
    if (photoEditorOpen) dialog.current?.showModal();
  }, [photoEditorOpen]);
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  function renderPreview(content: React.ReactNode) {
    return previewTarget === undefined
      ? content
      : previewTarget
        ? createPortal(content, previewTarget)
        : null;
  }
  return (
    <>
      {renderPreview(
        <div className="flex w-fit flex-col items-center gap-2">
          <div className="flex gap-1">
            <button
              type="button"
              className="btn btn-circle btn-soft btn-primary btn-sm"
              aria-label={t('editPhoto')}
              title={t('editPhoto')}
              disabled={busy}
              onClick={() => {
                setPhotoEditorOpen(true);
              }}
            >
              <Pencil className="size-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              className="btn btn-circle btn-soft btn-error btn-sm"
              aria-label={t(removePhoto ? 'undoRemovePhoto' : 'removePhoto')}
              title={t(removePhoto ? 'undoRemovePhoto' : 'removePhoto')}
              disabled={busy || (!effectiveImage && !removePhoto)}
              onClick={() => {
                onChange(removePhoto ? undefined : null);
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
          <div className="size-16 text-xl sm:size-24">
            <ImagePreview
              key={effectiveImage}
              name={name}
              image={effectiveImage}
              alt={t('photoPreview')}
              size={96}
              round={round}
            />
          </div>
        </div>,
      )}
      {photoEditorOpen &&
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
              setCropReady(false);
              const input =
                dialog.current?.querySelector<HTMLInputElement>(
                  'input[type=file]',
                );
              if (input) input.value = '';
            }}
          >
            <div className="modal-box max-w-md text-start">
              <div className="flex items-center justify-between gap-3">
                <Title id={titleId}>{t('editPhoto')}</Title>
                <ModalCloseButton label={t('cancel')} />
              </div>
              <div className="mt-4 flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div
                    ref={setCropTarget}
                    className="size-16 shrink-0 sm:size-24"
                  >
                    {(!photoEditorOpen || !cropSource) && (
                      <ImagePreview
                        key={effectiveImage}
                        name={name}
                        image={effectiveImage}
                        alt={t('photoPreview')}
                        size={96}
                        round={round}
                      />
                    )}
                  </div>
                  <label className="flex min-w-0 flex-1 flex-col gap-1.5 text-sm font-semibold">
                    {fileLabel ?? t('photo')}
                    <input
                      type="file"
                      accept={accept}
                      aria-invalid={photoError}
                      className="file-input file-input-sm w-full rounded-full font-normal"
                      onChange={(event) => {
                        const file = event.currentTarget.files?.[0];
                        setCropReady(false);
                        const valid =
                          file &&
                          file.size > 0 &&
                          file.size <= maxBytes &&
                          accept.split(',').includes(file.type);
                        setPhotoError(Boolean(file && !valid));
                        setPreview(
                          valid ? URL.createObjectURL(file) : undefined,
                        );
                      }}
                    />
                    <span className="font-normal text-base-content/70">
                      {t('photoHint')}
                    </span>
                  </label>
                </div>
                {photoError && <FormError>{t('invalidAvatar')}</FormError>}
                {photoEditorOpen && cropSource && (
                  <ImageCrop
                    key={cropSource}
                    size={outputSize}
                    round={round}
                    src={cropSource}
                    previewTarget={cropTarget}
                    onReady={setCropReady}
                  />
                )}
                <button
                  type="button"
                  className="btn btn-success w-fit self-center rounded-full"
                  disabled={!cropSource || !cropReady || busy}
                  onClick={() => {
                    const canvas = cropTarget?.querySelector<HTMLCanvasElement>(
                      'canvas[data-image-crop][data-ready]',
                    );
                    const crop = canvas?.toDataURL('image/png').split(',')[1];
                    if (!crop) return;
                    onChange(crop);
                    setRemovePhoto(false);
                    dialog.current?.close();
                  }}
                >
                  <Check className="size-4" aria-hidden="true" />
                  {t('save')}
                </button>
              </div>
            </div>
          </dialog>,
          document.body,
        )}
    </>
  );
}
