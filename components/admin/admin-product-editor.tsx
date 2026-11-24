'use client';
import { useId, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Check, Plus, X } from 'lucide-react';
import { RequiredFieldLabel } from '@/components/store/required-field-label';
import { FormError } from '@/components/ui/form-error';
import { useSkeletonPreview } from '@/components/dev-skeleton-preview';
import { ProductEditorSkeleton } from './product-editor-skeleton';
import {
  ProductImageGallery,
  type ProductImageDraft,
} from './product-image-gallery';
import { MAX_PRODUCT_IMAGE_UPLOAD_BYTES } from '@/lib/admin/product-image-config';
import { uniqueNameFromEnglish } from '@/lib/admin/unique-name';
import {
  productSchema,
  productStatuses,
  type ProductInput,
} from '@/lib/admin/product-input';
import {
  saveProduct,
  type SaveProductResult,
} from '@/app/[locale]/admin/products/actions';
type Category = { id: string; nameFa: string; nameEn: string };
type ProductDraft = Omit<ProductInput, 'variants'> & {
  variants: (Omit<ProductInput['variants'][number], 'stock'> & {
    stock: string | number;
  })[];
};
const emptyVariant = () => ({
  id: '',
  sku: '',
  nameFa: '',
  nameEn: '',
  price: '0',
  stock: 0,
  isActive: true,
});
export function AdminProductEditor({
  product,
  categories,
  imagePaths = [],
}: {
  product?: ProductInput;
  categories: Category[];
  imagePaths?: string[];
}) {
  const t = useTranslations('adminProducts');
  const locale = useLocale();
  const router = useRouter();
  const statusLabel = useId();
  const path = `/${locale}/admin/products`;
  const [draft, setDraft] = useState<ProductDraft>(
    product ?? {
      id: '',
      updatedAt: '',
      slug: '',
      nameFa: '',
      nameEn: '',
      descriptionFa: '',
      descriptionEn: '',
      status: 'DRAFT',
      categoryId: categories[0]?.id ?? '',
      variants: [emptyVariant()],
    },
  );
  const [customName, setCustomName] = useState(Boolean(product));
  const [images, setImages] = useState<ProductImageDraft[]>(() =>
    imagePaths.map((path) => ({ key: path, path })),
  );
  const [result, setResult] = useState<SaveProductResult | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [pending, startTransition] = useTransition();
  const skeletonPreview = useSkeletonPreview();
  if (skeletonPreview)
    return (
      <ProductEditorSkeleton
        variantCount={draft.variants.length}
        imageCount={images.length}
      />
    );
  const localized = (item: Category) =>
    locale === 'fa' ? item.nameFa : item.nameEn;
  const validation = productSchema.safeParse({
    ...draft,
    variants: draft.variants.map((variant) => ({
      ...variant,
      stock: variant.stock === '' ? Number.NaN : Number(variant.stock),
    })),
  });
  const issues = validation.success
    ? []
    : validation.error.issues.filter(
        (issue) => submitted || issue.code === 'too_big',
      );
  function fieldFeedback(path: string, message: string, serverError?: string) {
    const fieldIssues = issues.filter((issue) => issue.path.join('.') === path);
    const invalid = fieldIssues.length > 0 || Boolean(serverError);
    const limit = fieldIssues.find((issue) => issue.code === 'too_big');
    const errorMessage = limit
      ? t(
          path.endsWith('.stock')
            ? 'validation.stockLimit'
            : path.endsWith('.price')
              ? 'validation.priceLimit'
              : 'validation.lengthLimit',
          { max: Number(limit.maximum) },
        )
      : fieldIssues.some(
            (issue) => issue.code === 'custom' && issue.message === 'duplicate',
          )
        ? t('validation.duplicate')
        : (serverError ?? message);
    const id = `${statusLabel}-error-${path}`;
    return {
      attributes: {
        'aria-invalid': invalid || undefined,
        'aria-describedby': invalid ? id : undefined,
      },
      error: invalid ? <FormError id={id}>{errorMessage}</FormError> : null,
    };
  }
  function field(
    key: 'nameFa' | 'nameEn' | 'slug' | 'descriptionFa' | 'descriptionEn',
  ) {
    const long = key.startsWith('description');
    const feedback = fieldFeedback(
      key,
      t(
        key === 'slug'
          ? 'validation.slug'
          : long
            ? 'validation.description'
            : 'validation.name',
      ),
      key === 'slug' &&
        result &&
        typeof result === 'object' &&
        result.slug === draft.slug.trim()
        ? t('validation.productSlugDuplicate')
        : undefined,
    );
    const props = {
      ...feedback.attributes,
      name: key,
      dir: key.endsWith('Fa') ? 'rtl' : 'ltr',
      value: draft[key],
      required: !long,
      onChange: (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
      ) => {
        const value = e.target.value;
        if (key === 'slug') setCustomName(true);
        setDraft({
          ...draft,
          [key]: value,
          ...(key === 'nameEn' && !customName
            ? { slug: uniqueNameFromEnglish(value) }
            : {}),
        });
      },
    };
    return (
      <label className="fieldset min-w-0">
        <span className="fieldset-legend">
          {long ? t(key) : <RequiredFieldLabel>{t(key)}</RequiredFieldLabel>}
        </span>
        {long ? (
          <textarea
            {...props}
            className="textarea w-full aria-invalid:textarea-error"
            rows={3}
          />
        ) : (
          <input
            {...props}
            pattern={key === 'slug' ? '[a-z0-9]+(-[a-z0-9]+)*' : undefined}
            className="input w-full aria-invalid:input-error"
          />
        )}
        {feedback.error}
      </label>
    );
  }

  return (
    <div className="p-4 sm:p-5">
      {!categories.length ? (
        <div className="alert alert-info">
          <p>{t('categoryFirst')}</p>
          <Link
            href={`/${locale}/admin/categories`}
            className="btn btn-primary btn-sm"
          >
            {t('categories')}
          </Link>
        </div>
      ) : (
        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            setSubmitted(true);
            setResult(null);
            if (!validation.success) return;
            startTransition(async () => {
              const imageForm = new FormData();
              for (const image of images) {
                if (image.crop) {
                  const bytes = Uint8Array.from(atob(image.crop), (character) =>
                    character.charCodeAt(0),
                  );
                  if (bytes.length > MAX_PRODUCT_IMAGE_UPLOAD_BYTES) {
                    setResult('invalidImage');
                    return;
                  }
                  imageForm.append(
                    'image',
                    new File([bytes], 'product.webp', { type: 'image/webp' }),
                  );
                } else if (image.crop === undefined && image.path) {
                  imageForm.append('image', image.path);
                }
              }
              const response = await saveProduct(validation.data, imageForm);
              setResult(response);
              if (response === 'saved') {
                router.push(path);
                router.refresh();
              }
            });
          }}
        >
          <fieldset disabled={pending} className="grid min-w-0">
            <ProductImageGallery
              images={images}
              onChange={setImages}
              disabled={pending}
            />
            <div className="grid min-w-0 gap-x-4 md:grid-cols-3">
              {field('nameFa')}
              {field('nameEn')}
              {field('slug')}
            </div>
            <div className="grid min-w-0 gap-x-4 sm:grid-cols-2">
              <label className="fieldset">
                <span className="fieldset-legend">
                  <RequiredFieldLabel>{t('category')}</RequiredFieldLabel>
                </span>
                <select
                  className="select w-full"
                  value={draft.categoryId}
                  required
                  onChange={(e) =>
                    setDraft({ ...draft, categoryId: e.target.value })
                  }
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {localized(c)}
                    </option>
                  ))}
                </select>
              </label>
              <div className="fieldset min-w-0">
                <span id={statusLabel} className="fieldset-legend">
                  <RequiredFieldLabel>{t('status')}</RequiredFieldLabel>
                </span>
                <div
                  role="radiogroup"
                  aria-labelledby={statusLabel}
                  aria-required="true"
                  className="flex min-h-10 flex-wrap items-center gap-x-4 gap-y-2"
                >
                  {productStatuses.map((status) => (
                    <label key={status} className="label text-base-content">
                      <input
                        type="radio"
                        name="status"
                        value={status}
                        className="radio radio-primary radio-sm"
                        checked={draft.status === status}
                        required
                        onChange={() => setDraft({ ...draft, status })}
                      />
                      {t(`statuses.${status}`)}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            {field('descriptionFa')}
            {field('descriptionEn')}
            <div>
              <h3 className="mt-5 font-semibold">{t('variants')}</h3>
              <p className="my-2 text-xs leading-6 text-base-content/60">
                {t('variantHint')}
              </p>
              {issues
                .filter((issue) => issue.path.join('.') === 'variants')
                .map((issue) => (
                  <div key={issue.message}>
                    <FormError>
                      {t(
                        issue.message === 'active'
                          ? 'validation.active'
                          : issue.message === 'duplicate'
                            ? 'validation.duplicate'
                            : 'validation.variantCount',
                      )}
                    </FormError>
                  </div>
                ))}
              <div className="space-y-3">
                {draft.variants.map((v, index) => (
                  <fieldset
                    key={index}
                    className="rounded-box border border-base-content/10 bg-base-200/40 p-3"
                  >
                    <legend className="px-2 text-sm">
                      {t('variantNumber', { number: index + 1 })}
                    </legend>
                    <div className="grid gap-3 sm:grid-cols-3">
                      {(
                        ['nameFa', 'nameEn', 'sku', 'price', 'stock'] as const
                      ).map((key) => {
                        const feedback = fieldFeedback(
                          `variants.${index}.${key}`,
                          t(
                            `validation.${key === 'nameFa' || key === 'nameEn' ? 'name' : key}`,
                          ),
                          key === 'sku' &&
                            result &&
                            typeof result === 'object' &&
                            result.skus.includes(v.sku.trim())
                            ? t('validation.productSkuDuplicate')
                            : undefined,
                        );
                        return (
                          <label className="fieldset min-w-0" key={key}>
                            <span className="fieldset-legend">
                              <RequiredFieldLabel>{t(key)}</RequiredFieldLabel>
                            </span>
                            <input
                              {...feedback.attributes}
                              className="input w-full aria-invalid:input-error"
                              dir={key === 'nameFa' ? 'rtl' : 'ltr'}
                              type={key === 'stock' ? 'number' : 'text'}
                              inputMode={
                                key === 'price' || key === 'stock'
                                  ? 'numeric'
                                  : undefined
                              }
                              min={key === 'stock' ? 0 : undefined}
                              pattern={
                                key === 'price' ? '[0-9]{1,18}' : undefined
                              }
                              required
                              value={v[key]}
                              onChange={(e) =>
                                setDraft({
                                  ...draft,
                                  variants: draft.variants.map((old, i) =>
                                    i === index
                                      ? {
                                          ...old,
                                          [key]: e.target.value,
                                        }
                                      : old,
                                  ),
                                })
                              }
                            />
                            {feedback.error}
                          </label>
                        );
                      })}
                      <div className="flex min-h-10 items-center justify-between gap-2 sm:mb-1 sm:self-end">
                        <label className="label cursor-pointer gap-2 text-sm">
                          <input
                            type="checkbox"
                            className="toggle toggle-primary toggle-sm"
                            checked={v.isActive}
                            onChange={(e) =>
                              setDraft({
                                ...draft,
                                variants: draft.variants.map((old, i) =>
                                  i === index
                                    ? { ...old, isActive: e.target.checked }
                                    : old,
                                ),
                              })
                            }
                          />
                          {t('variantActive')}
                        </label>
                        {!v.id && draft.variants.length > 1 && (
                          <button
                            type="button"
                            className="btn btn-square btn-sm btn-soft btn-error"
                            aria-label={t('removeVariant')}
                            onClick={() =>
                              setDraft({
                                ...draft,
                                variants: draft.variants.filter(
                                  (_, i) => i !== index,
                                ),
                              })
                            }
                          >
                            <X size={16} aria-hidden="true" />
                          </button>
                        )}
                      </div>
                    </div>
                  </fieldset>
                ))}
              </div>
              <button
                type="button"
                className="btn btn-soft btn-primary btn-sm mt-3"
                disabled={draft.variants.length >= 50}
                onClick={() =>
                  setDraft({
                    ...draft,
                    variants: [...draft.variants, emptyVariant()],
                  })
                }
              >
                <Plus size={16} aria-hidden="true" />
                {t('addVariant')}
              </button>
            </div>
          </fieldset>
          {submitted && issues.length > 0 && (
            <FormError className="mt-4">{t('validation.review')}</FormError>
          )}
          {typeof result === 'string' && result !== 'saved' && (
            <FormError className="mt-4">{t(`results.${result}`)}</FormError>
          )}
          <div className="mt-6 flex flex-wrap justify-end gap-2">
            <button
              type="button"
              className="btn btn-soft btn-error rounded-full"
              disabled={pending}
              onClick={() => router.push(path)}
            >
              <X size={16} aria-hidden="true" />
              {t('cancel')}
            </button>
            <button
              type="submit"
              className="btn btn-success rounded-full"
              disabled={pending}
            >
              {pending ? (
                <span
                  className="loading loading-spinner loading-xs"
                  aria-hidden="true"
                />
              ) : (
                <Check size={16} aria-hidden="true" />
              )}
              {t(pending ? 'saving' : 'save')}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
