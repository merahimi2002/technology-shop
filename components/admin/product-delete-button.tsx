'use client';

import { useId, useRef, useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { Trash2 } from 'lucide-react';
import { ModalCloseButton } from '@/components/modal-close-button';
import { FormError } from '@/components/ui/form-error';
import {
  deleteProduct,
  type DeleteProductResult,
} from '@/app/[locale]/admin/products/actions';

export function ProductDeleteButton({
  id,
  updatedAt,
  name,
}: {
  id: string;
  updatedAt: string;
  name: string;
}) {
  const t = useTranslations('adminProducts');
  const dialog = useRef<HTMLDialogElement>(null);
  const title = useId();
  const description = useId();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<DeleteProductResult | null>(null);

  return (
    <>
      <span
        className="tooltip tooltip-top tooltip-error focus-within:tooltip-open"
        data-tip={t('deleteProduct')}
      >
        <button
          type="button"
          className="btn btn-square btn-sm btn-soft btn-error"
          aria-label={t('deleteNamedProduct', { name })}
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
        aria-describedby={description}
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
              {t('confirmProductDelete', { name })}
            </h2>
            <ModalCloseButton disabled={pending} label={t('cancel')} />
          </div>
          <p
            id={description}
            className="mt-4 text-sm leading-7 text-base-content/70"
          >
            {t('deleteProductDescription')}
          </p>
          {result && result !== 'saved' && (
            <FormError className="mt-4">
              {t(`deleteResults.${result}`)}
            </FormError>
          )}
          <form
            className="modal-action"
            onSubmit={(event) => {
              event.preventDefault();
              if (pending) return;
              startTransition(async () => {
                const response = await deleteProduct({ id, updatedAt });
                if (response === 'saved') dialog.current?.close();
                else setResult(response);
              });
            }}
          >
            <button
              type="button"
              className="btn btn-ghost"
              autoFocus
              disabled={pending}
              onClick={() => dialog.current?.close()}
            >
              {t('cancel')}
            </button>
            <button type="submit" className="btn btn-error" disabled={pending}>
              <Trash2 size={16} aria-hidden="true" />
              {t(pending ? 'deletingProduct' : 'deleteProduct')}
            </button>
          </form>
        </div>
      </dialog>
    </>
  );
}
