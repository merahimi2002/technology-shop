'use client';
import { useTranslations } from 'next-intl';
import { ImageEditor } from '@/components/ui/image-editor';
import {
  CATEGORY_IMAGE_ACCEPT,
  MAX_CATEGORY_IMAGE_BYTES,
} from '@/lib/category-image-config';
export function CategoryImageField({
  category,
  disabled,
  value,
  onChange,
}: {
  category?: { id: string; imagePath: string | null };
  disabled: boolean;
  value?: string | null;
  onChange: (value?: string | null) => void;
}) {
  const t = useTranslations('adminProducts');
  return (
    <div className="sm:col-span-2 xl:col-span-3">
      <p className="mb-3 text-sm font-semibold">{t('categoryImage')}</p>
      <ImageEditor
        value={value}
        onChange={onChange}
        image={
          category?.imagePath
            ? '/api/admin/categories/' +
              category.id +
              '/image?v=' +
              encodeURIComponent(category.imagePath)
            : null
        }
        busy={disabled}
        accept={CATEGORY_IMAGE_ACCEPT}
        maxBytes={MAX_CATEGORY_IMAGE_BYTES}
        fileLabel={t('categoryImage')}
      />
      <p className="mt-2 text-xs leading-6 text-base-content/60">
        {t('categoryImageHint')}
      </p>
    </div>
  );
}
