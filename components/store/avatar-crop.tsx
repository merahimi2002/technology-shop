'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { createPortal } from 'react-dom';

const SIZE = 160;
const clamp = (value: number) => Math.max(0, Math.min(1, value));

export function AvatarCrop({
  src,
  previewTarget,
}: {
  src: string;
  previewTarget: HTMLElement | null;
}) {
  const t = useTranslations('account.profile');
  const canvas = useRef<HTMLCanvasElement>(null);
  const drag = useRef<{ x: number; y: number; left: number; top: number }>(
    null,
  );
  const [image, setImage] = useState<HTMLImageElement>();
  const [failed, setFailed] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0.5, y: 0.5 });
  const side = image
    ? Math.min(image.naturalWidth, image.naturalHeight) / zoom
    : 0;
  const width = image ? image.naturalWidth - side : 0;
  const height = image ? image.naturalHeight - side : 0;

  useEffect(() => {
    const photo = new window.Image();
    photo.onload = () => setImage(photo);
    photo.onerror = () => setFailed(true);
    photo.src = src;
    return () => {
      photo.onload = null;
      photo.onerror = null;
    };
  }, [src]);

  useLayoutEffect(() => {
    const context = canvas.current?.getContext('2d');
    if (!image || !context) return;
    context.clearRect(0, 0, SIZE, SIZE);
    context.drawImage(
      image,
      width * position.x,
      height * position.y,
      side,
      side,
      0,
      0,
      SIZE,
      SIZE,
    );
    canvas.current?.setAttribute('data-ready', '');
  }, [image, width, height, side, position]);

  return (
    <div className="flex flex-wrap items-center gap-3">
      {previewTarget &&
        createPortal(
          <canvas
            ref={canvas}
            data-avatar-crop
            width={SIZE}
            height={SIZE}
            role="img"
            aria-label={t('photoPreview')}
            className="block size-16 touch-none cursor-grab rounded-full bg-base-200 active:cursor-grabbing sm:size-24"
            onPointerDown={(event) => {
              if (!event.isPrimary || event.button !== 0) return;
              event.currentTarget.setPointerCapture(event.pointerId);
              drag.current = {
                x: event.clientX,
                y: event.clientY,
                left: position.x,
                top: position.y,
              };
            }}
            onPointerMove={(event) => {
              const start = drag.current;
              if (
                !start ||
                !event.currentTarget.hasPointerCapture(event.pointerId)
              )
                return;
              const scale = side / event.currentTarget.clientWidth;
              setPosition({
                x: width
                  ? clamp(
                      start.left - ((event.clientX - start.x) * scale) / width,
                    )
                  : 0.5,
                y: height
                  ? clamp(
                      start.top - ((event.clientY - start.y) * scale) / height,
                    )
                  : 0.5,
              });
            }}
            onLostPointerCapture={() => {
              drag.current = null;
            }}
          />,
          previewTarget,
        )}
      {failed ? (
        <p role="alert" className="text-sm text-error">
          {t('invalidAvatar')}
        </p>
      ) : (
        <div className="flex min-w-36 flex-1 flex-col gap-1 text-xs" dir="ltr">
          <label className="flex items-center justify-between gap-2" dir="auto">
            {t('photoZoom')}
            <input
              type="range"
              min="1"
              max="3"
              step="0.01"
              value={zoom}
              onChange={(e) => setZoom(e.currentTarget.valueAsNumber)}
              disabled={!image}
              className="range range-primary range-xs w-20 [direction:ltr]"
            />
          </label>
          <label className="flex items-center justify-between gap-2" dir="auto">
            {t('photoHorizontal')}
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={position.x}
              onChange={(e) =>
                setPosition({ ...position, x: e.currentTarget.valueAsNumber })
              }
              disabled={!width}
              className="range range-primary range-xs w-20 [direction:ltr]"
            />
          </label>
          <label className="flex items-center justify-between gap-2" dir="auto">
            {t('photoVertical')}
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={position.y}
              onChange={(e) =>
                setPosition({ ...position, y: e.currentTarget.valueAsNumber })
              }
              disabled={!height}
              className="range range-primary range-xs w-20 [direction:ltr]"
            />
          </label>
        </div>
      )}
    </div>
  );
}
