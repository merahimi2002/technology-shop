'use client';

import { RequiredFieldLabel } from './required-field-label';
import { useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { KeyRound } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { ModalCloseButton } from '@/components/modal-close-button';
import { Title } from '@/components/title';
import {
  recoveryRequestSchema,
  resetPasswordSchema,
} from '@/lib/auth/validation';

export function PasswordRecovery({ reset = false }: { reset?: boolean }) {
  const locale = useLocale();
  const t = useTranslations('account');
  const common = useTranslations('common');
  const dialog = useRef<HTMLDialogElement>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget;
    const fields = Object.fromEntries(new FormData(form));
    const parsed = reset
      ? resetPasswordSchema.safeParse({
          ...fields,
          token: window.location.hash.slice(1),
        })
      : recoveryRequestSchema.safeParse({ email: fields.email, locale });

    setError('');
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      setError(
        issue.path[0] === 'token'
          ? t('recovery.invalidLink')
          : issue.code === 'custom'
            ? t('validation.passwordMismatch')
            : reset
              ? t('recovery.invalidPassword')
              : t('validation.emailInvalid'),
      );
      return;
    }

    setBusy(true);
    try {
      const response = await fetch('/api/account/recovery', {
        method: reset ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });
      if (!response.ok) {
        const { error: code } = await response.json();
        setError(
          code === 'INVALID_LINK'
            ? t('recovery.invalidLink')
            : response.status === 429
              ? t('limited')
              : t('unavailable'),
        );
        return;
      }
      if (reset)
        window.history.replaceState(null, '', window.location.pathname);
      form.reset();
      setDone(true);
    } catch {
      setError(t('unavailable'));
    } finally {
      setBusy(false);
    }
  }

  const content = done ? (
    <div className="mt-4 flex flex-col items-start gap-4">
      <p role="status" className="text-success">
        {t(reset ? 'passwordChanged' : 'recovery.sent')}
      </p>
      {reset && (
        <Link
          href={`/${locale}/account`}
          className="btn btn-primary rounded-full"
        >
          {t('login')}
        </Link>
      )}
    </div>
  ) : (
    <form
      method="post"
      noValidate
      onSubmit={submit}
      aria-busy={busy}
      className="mt-4"
    >
      <fieldset disabled={busy} className="flex flex-col gap-4">
        {reset ? (
          (['password', 'confirmPassword'] as const).map((field) => (
            <label
              key={field}
              className="flex flex-col gap-1.5 text-sm font-semibold"
            >
              <RequiredFieldLabel>
                {t(
                  field === 'password'
                    ? 'passwordChange.newPassword'
                    : 'confirmPassword',
                )}
              </RequiredFieldLabel>
              <input
                name={field}
                type="password"
                dir="ltr"
                autoComplete="new-password"
                required
                maxLength={128}
                className="input w-full rounded-full!"
              />
            </label>
          ))
        ) : (
          <label className="flex flex-col gap-1.5 text-sm font-semibold">
            <RequiredFieldLabel>{t('email')}</RequiredFieldLabel>
            <input
              name="email"
              type="email"
              dir="ltr"
              autoComplete="email"
              required
              maxLength={254}
              className="input w-full rounded-full! text-left"
            />
          </label>
        )}
        {error && (
          <p role="alert" className="text-sm text-error">
            {error}
          </p>
        )}
        <button type="submit" className="btn btn-primary w-fit rounded-full">
          {busy ? t('loading') : t(reset ? 'profile.save' : 'recovery.send')}
        </button>
      </fieldset>
    </form>
  );

  if (reset)
    return (
      <section className="rounded-box border border-base-content/15 bg-base-200 p-5 sm:p-8">
        <Title as="h1">{t('recovery.reset')}</Title>
        {content}
      </section>
    );

  return (
    <>
      <button
        type="button"
        data-account-reveal
        className="btn btn-link mt-2 w-fit px-0"
        aria-haspopup="dialog"
        onClick={() => dialog.current?.showModal()}
      >
        <KeyRound aria-hidden="true" className="size-4" />
        {t('recovery.title')}
      </button>
      <dialog
        ref={dialog}
        className="modal"
        aria-labelledby="password-recovery-title"
        onCancel={(event) => {
          if (busy) event.preventDefault();
        }}
        onClose={() => {
          setDone(false);
          setError('');
        }}
      >
        <div className="modal-box">
          <div className="flex items-center justify-between gap-4">
            <h2 id="password-recovery-title" className="text-lg font-bold">
              {t('recovery.title')}
            </h2>
            <ModalCloseButton label={common('close')} disabled={busy} />
          </div>
          {content}
        </div>
        <form method="dialog" className="modal-backdrop">
          <button disabled={busy} aria-label={common('close')} tabIndex={-1} />
        </form>
      </dialog>
    </>
  );
}
