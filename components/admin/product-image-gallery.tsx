'use client';

import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useFormatter, useTranslations } from 'next-intl';
import { ImageEditor } from '@/components/ui/image-editor';
import {
  MAX_PRODUCT_IMAGES,
  productImageUrl,
} from '@/lib/admin/product-image-config';

export type ProductImageDraft = {
  key: string;
  path?: string;
  crop?: string | null;
};

export function ProductImageGallery({
  images,
  onChange,
  disabled,
}: {
  images: ProductImageDraft[];
  onChange: (images: ProductImageDraft[]) => void;
  disabled: boolean;
}) {
  const t = useTranslations('adminProducts');
  const format = useFormatter();
  const [newSlot, setNewSlot] = useState<string>();
  return (
    <fieldset className="mb-4 min-w-0">
      <legend className="text-sm font-semibold">{t('productImages')}</legend>
      <p className="my-2 text-sm text-base-content/70">
        {t('productImagesHint', { count: MAX_PRODUCT_IMAGES })}
      </p>
      <div className="flex flex-wrap gap-3">
        {images.map((image, index) => (
          <div
            key={image.key}
            role="group"
            aria-label={t('productImageNumber', { number: index + 1 })}
            className="rounded-box border border-base-content/10 p-2"
          >
            <label className="mb-2 flex items-center justify-between gap-2 text-xs">
              {t('productImageOrder')}
              <select
                className="select select-xs w-auto"
                value={index}
                disabled={disabled || images.length < 2}
                onChange={(event) => {
                  const position = Number(event.target.value);
                  const reordered = images.filter(
                    (slot) => slot.key !== image.key,
                  );
                  reordered.splice(position, 0, image);
                  onChange(reordered);
                }}
              >
                {images.map((slot, position) => (
                  <option key={slot.key} value={position}>
                    {format.number(position + 1)}
                  </option>
                ))}
              </select>
            </label>
            <ImageEditor
              fileLabel={t('productImageNumber', { number: index + 1 })}
              image={productImageUrl(image.path)}
              initiallyOpen={image.key === newSlot}
              value={image.crop}
              outputType="image/webp"
              busy={disabled}
              onRemove={() =>
                onChange(images.filter((slot) => slot.key !== image.key))
              }
              onChange={(crop) =>
                onChange(
                  images.map((slot) =>
                    slot.key === image.key ? { ...slot, crop } : slot,
                  ),
                )
              }
            />
          </div>
        ))}
        <button
          type="button"
          className="btn btn-soft btn-primary min-h-36 w-[5.125rem] flex-col gap-2 self-stretch rounded-box border border-dashed border-primary/40 px-2 py-3 text-xs whitespace-normal sm:min-h-44 sm:w-[7.125rem]"
          disabled={disabled || images.length >= MAX_PRODUCT_IMAGES}
          onClick={() => {
            const key = crypto.randomUUID();
            setNewSlot(key);
            onChange([...images, { key }]);
          }}
        >
          <Plus size={24} aria-hidden="true" />
          {t('addProductImage')}
        </button>
      </div>
    </fieldset>
  );
}
