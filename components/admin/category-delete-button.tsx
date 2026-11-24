'use client';
import { FormError } from '@/components/ui/form-error';

import { useId, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Trash2 } from 'lucide-react';
import { ModalCloseButton } from '@/components/modal-close-button';
import {
  deleteCategory,
  type CategoryResult,
} from '@/app/[locale]/admin/categories/actions';

export function CategoryDeleteButton({
  category,
}: {
  category: {
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
  const dialog = useRef<HTMLDialogElement>(null);
  const title = useId();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<CategoryResult | null>(null);
  return (
    <>
      <span
        className="tooltip tooltip-top tooltip-error focus-within:tooltip-open"
        data-tip={t('deleteCategory')}
      >
        <button
          type="button"
          className="btn btn-square btn-sm btn-soft btn-error"
          aria-label={t('deleteCategory')}
          aria-haspopup="dialog"
          onClick={() => {
            setResult(null);
            dialog.current?.showModal();
          }}
        >
          <Trash2 size={18} aria-hidden="true" />
        </button>
      </span>
      <dialog
        ref={dialog}
        className="modal"
        aria-labelledby={title}
        onCancel={(event) => {
          if (pending) event.preventDefault();
        }}
      >
        <div className="modal-box">
          <div className="flex items-start justify-between gap-3">
            <h2
              id={title}
              className="flex items-center gap-2 text-lg font-bold"
            >
              <Trash2
                size={20}
                className="shrink-0 text-error"
                aria-hidden="true"
              />
              {t('confirmCategoryDelete', {
                name: locale === 'fa' ? category.nameFa : category.nameEn,
              })}
            </h2>
            <ModalCloseButton disabled={pending} label={t('cancel')} />
          </div>
          <p className="mt-4 text-sm leading-7 text-base-content/70">
            {t('deleteCategoryDescription')}
          </p>
          {result && result !== 'saved' && (
            <FormError className="mt-4">{t(`results.${result}`)}</FormError>
          )}
          <form
            className="modal-action"
            onSubmit={(event) => {
              event.preventDefault();
              startTransition(async () => {
                const response = await deleteCategory(category);
                setResult(response);
                if (response === 'saved') {
                  dialog.current?.close();
                  router.refresh();
                }
              });
            }}
          >
            <button
              type="button"
              className="btn btn-ghost"
              disabled={pending}
              onClick={() => dialog.current?.close()}
            >
              {t('cancel')}
            </button>
            <button type="submit" className="btn btn-error" disabled={pending}>
              <Trash2 size={16} aria-hidden="true" />
              {t(pending ? 'saving' : 'deleteCategory')}
            </button>
          </form>
        </div>
      </dialog>
    </>
  );
}
