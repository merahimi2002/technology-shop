'use client';

import { useId, useState, useTransition } from 'react';
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
import { categorySchema } from '@/lib/admin/product-input';
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
  const fieldId = useId();
  const [result, setResult] = useState<CategoryImageResult | null>(null);
  const [submitted, setSubmitted] = useState(false);
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
  const validation = categorySchema.safeParse(names);
  const issues = validation.success
    ? []
    : validation.error.issues.filter(
        (issue) => submitted || issue.code === 'too_big',
      );
  return (
    <form
      noValidate
      className="p-4 sm:p-5"
      onSubmit={(event) => {
        event.preventDefault();
        setSubmitted(true);
        setResult(null);
        if (!validation.success) return;
        const input = new FormData(event.currentTarget);
        for (const [key, value] of Object.entries(validation.data))
          input.set(key, value);
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
        {(['nameFa', 'nameEn', 'slug'] as const).map((key) => {
          const id = `${fieldId}-${key}`;
          const fieldIssues = issues.filter((issue) => issue.path[0] === key);
          const limit = fieldIssues.find((issue) => issue.code === 'too_big');
          const message = limit
            ? t('validation.lengthLimit', { max: Number(limit.maximum) })
            : fieldIssues.length
              ? t(key === 'slug' ? 'validation.slug' : 'validation.name')
              : key === 'slug' && result === 'duplicate'
                ? t('validation.categoryDuplicate')
                : null;
          return (
            <div className="fieldset min-w-0" key={key}>
              <label htmlFor={id} className="fieldset-legend">
                <RequiredFieldLabel>{t(key)}</RequiredFieldLabel>
              </label>
              <input
                id={id}
                aria-invalid={Boolean(message) || undefined}
                aria-describedby={message ? `${id}-error` : undefined}
                className="input w-full aria-invalid:input-error"
                name={key}
                value={names[key]}
                onChange={(event) => {
                  const value = event.currentTarget.value;
                  if (key === 'slug') setCustomName(true);
                  if (key === 'slug' || (key === 'nameEn' && !customName)) {
                    setResult((current) =>
                      current === 'duplicate' ? null : current,
                    );
                  }
                  setNames((current) => ({
                    ...current,
                    [key]: value,
                    ...(key === 'nameEn' && !customName
                      ? { slug: uniqueNameFromEnglish(value) }
                      : {}),
                  }));
                }}
                required
                pattern={key === 'slug' ? '[a-z0-9]+(-[a-z0-9]+)*' : undefined}
                dir={key === 'nameFa' ? 'rtl' : 'ltr'}
              />
              {message && <FormError id={`${id}-error`}>{message}</FormError>}
            </div>
          );
        })}
        <CategoryImageField
          category={category}
          disabled={pending}
          value={image}
          onChange={setImage}
        />
      </fieldset>
      {submitted && issues.length > 0 && (
        <FormError className="mt-4">{t('validation.review')}</FormError>
      )}
      {result && result !== 'saved' && result !== 'duplicate' && (
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
