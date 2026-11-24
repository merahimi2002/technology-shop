'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Check, X } from 'lucide-react';
import {
  saveCategoryWithImage,
  type CategoryImageResult,
} from '@/app/[locale]/admin/categories/image-actions';
import { CategoryImageField } from './category-image-field';
import { RequiredFieldLabel } from '@/components/store/required-field-label';
import { FormError } from '@/components/ui/form-error';
import { uniqueNameFromEnglish } from '@/lib/admin/unique-name';
import {
  CategoryEditorSkeleton,
  categoryEditorGrid,
} from './category-editor-skeleton';
import { useSkeletonPreview } from '@/components/dev-skeleton-preview';

export function AdminCategoryEditor({
  category,
}: {
  category?: {
    id: string;
    slug: string;
    nameFa: string;
    nameEn: string;
    imagePath: string | null;
  };
}) {
  const t = useTranslations('adminProducts');
  const locale = useLocale();
  const router = useRouter();
  const [result, setResult] = useState<CategoryImageResult | null>(null);
  const [image, setImage] = useState<string | null>();
  const [names, setNames] = useState({
    nameFa: category?.nameFa ?? '',
    nameEn: category?.nameEn ?? '',
    slug: category?.slug ?? '',
  });
  const [customName, setCustomName] = useState(Boolean(category));
  const [pending, startTransition] = useTransition();
  const path = `/${locale}/admin/categories`;
  const skeletonPreview = useSkeletonPreview();
  if (skeletonPreview) return <CategoryEditorSkeleton />;
  return (
    <form
      className="p-4 sm:p-5"
      onSubmit={(event) => {
        event.preventDefault();
        const input = new FormData(event.currentTarget);
        if (image) {
          const bytes = Uint8Array.from(atob(image), (character) =>
            character.charCodeAt(0),
          );
          input.set(
            'image',
            new File([bytes], 'category.png', { type: 'image/png' }),
          );
        }
        input.set('removeImage', String(image === null));
        startTransition(async () => {
          const response = await saveCategoryWithImage(category ?? null, input);
          setResult(response);
          if (response === 'saved') {
            router.push(path);
            router.refresh();
          }
        });
      }}
    >
      <fieldset disabled={pending} className={categoryEditorGrid}>
        {(['nameFa', 'nameEn', 'slug'] as const).map((key) => (
          <label className="fieldset min-w-0" key={key}>
            <span className="fieldset-legend">
              <RequiredFieldLabel>{t(key)}</RequiredFieldLabel>
            </span>
            <input
              className="input w-full"
              name={key}
              value={names[key]}
              onChange={(event) => {
                const value = event.currentTarget.value;
                if (key === 'slug') setCustomName(true);
                setNames((current) => ({
                  ...current,
                  [key]: value,
                  ...(key === 'nameEn' && !customName
                    ? { slug: uniqueNameFromEnglish(value) }
                    : {}),
                }));
              }}
              required
              maxLength={key === 'slug' ? 120 : 160}
              pattern={key === 'slug' ? '[a-z0-9]+(-[a-z0-9]+)*' : undefined}
              dir={key === 'nameFa' ? 'rtl' : 'ltr'}
            />
          </label>
        ))}
        <CategoryImageField
          category={category}
          disabled={pending}
          value={image}
          onChange={setImage}
        />
      </fieldset>
      {result && result !== 'saved' && (
        <FormError className="mt-4">{t(`results.${result}`)}</FormError>
      )}
      <div className="mt-6 flex flex-wrap justify-end gap-2">
        <button
          type="button"
          disabled={pending}
          className="btn btn-soft btn-error rounded-full"
          onClick={() => router.push(path)}
        >
          <X size={16} aria-hidden="true" />
          {t('cancel')}
        </button>
        <button
          type="submit"
          disabled={pending}
          className="btn btn-success rounded-full"
        >
          <Check size={16} aria-hidden="true" />
          {t(pending ? 'saving' : 'confirm')}
        </button>
      </div>
    </form>
  );
}
