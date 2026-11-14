'use client';

import { useRef, useState, type FormEvent } from 'react';
import { Check, Eye, EyeOff, LockKeyhole } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ModalCloseButton } from '@/components/modal-close-button';
import { GradientButton } from '@/components/gradient-button';
import { changePasswordSchema } from '@/lib/auth/validation';

const fields = ['currentPassword', 'newPassword', 'confirmPassword'] as const;
type PasswordField = (typeof fields)[number];

type PasswordEditorProps = {
  busy: boolean;
  onSavingChange: (saving: boolean) => void;
  onChanged: () => Promise<void>;
};

export function PasswordEditor({
  busy,
  onSavingChange,
  onChanged,
}: PasswordEditorProps) {
  const t = useTranslations('account');
  const common = useTranslations('common');
  const dialog = useRef<HTMLDialogElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const editedFields = useRef(new Set<PasswordField>());
  const [visible, setVisible] = useState<
    Partial<Record<PasswordField, boolean>>
  >({});
  const [errors, setErrors] = useState<Partial<Record<PasswordField, string>>>(
    {},
  );
  const [message, setMessage] = useState('');

  function validate(form: HTMLFormElement) {
    const input = changePasswordSchema.safeParse(
      Object.fromEntries(new FormData(form)),
    );
    const nextErrors: typeof errors = {};
    for (const issue of input.error?.issues ?? []) {
      const field = fields.find((name) => name === issue.path[0]);
      if (!field || !editedFields.current.has(field) || nextErrors[field])
        continue;
      nextErrors[field] =
        issue.code === 'too_big'
          ? t('validation.tooLong', { max: Number(issue.maximum) })
          : issue.code === 'custom'
            ? t(
                field === 'confirmPassword'
                  ? 'validation.passwordMismatch'
                  : 'passwordChange.different',
              )
            : issue.code === 'too_small' && issue.minimum === 8
              ? t('validation.passwordTooShort')
              : t(
                  field === 'currentPassword'
                    ? 'passwordChange.currentRequired'
                    : field === 'newPassword'
                      ? 'passwordChange.newRequired'
                      : 'validation.required.confirmPassword',
                );
    }
    setErrors(nextErrors);
    return { input, nextErrors };
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget;
    fields.forEach((field) => editedFields.current.add(field));
    const { input, nextErrors } = validate(form);
    setMessage('');
    if (!input.success) {
      form
        .querySelector<HTMLInputElement>(
          `[name="${fields.find((field) => nextErrors[field])}"]`,
        )
        ?.focus();
      return;
    }

    setErrors({});
    onSavingChange(true);
    try {
      const response = await fetch('/api/account/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input.data),
      });
      if (response.ok) {
        dialog.current?.close();
        await onChanged();
      } else if (response.status === 422) {
        setErrors({ currentPassword: t('passwordChange.wrongCurrent') });
      } else if (response.status === 429) {
        setMessage(t('limited'));
      } else if ([401, 403, 409].includes(response.status)) {
        setMessage(t('profile.accountChanged'));
      } else {
        setMessage(t('unavailable'));
      }
    } catch {
      setMessage(t('unavailable'));
    } finally {
      onSavingChange(false);
    }
  }

  return (
    <>
      <GradientButton
        type="button"
        data-account-reveal
        className="w-fit self-center"
        icon={<LockKeyhole />}
        aria-haspopup="dialog"
        aria-controls="password-change-dialog"
        disabled={busy}
        onClick={() => dialog.current?.showModal()}
      >
        {t('passwordChange.title')}
      </GradientButton>
      <dialog
        ref={dialog}
        id="password-change-dialog"
        className="modal"
        aria-labelledby="password-change-title"
        onCancel={(event) => {
          if (busy) event.preventDefault();
        }}
        onClose={() => {
          formRef.current?.reset();
          editedFields.current.clear();
          setVisible({});
          setErrors({});
          setMessage('');
        }}
      >
        <div className="modal-box">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 id="password-change-title" className="text-lg font-bold">
              {t('passwordChange.title')}
            </h2>
            <ModalCloseButton label={common('close')} disabled={busy} />
          </div>
          <form ref={formRef} noValidate onSubmit={save} aria-busy={busy}>
            <fieldset disabled={busy} className="flex flex-col gap-3">
              <p className="text-xs text-base-content/75">
                {t('passwordChange.signInAgain')}
              </p>
              {fields.map((field) => (
                <div key={field} className="flex flex-col gap-1.5 text-sm">
                  <label htmlFor={`profile-${field}`} className="font-semibold">
                    {t(
                      field === 'confirmPassword'
                        ? 'confirmPassword'
                        : `passwordChange.${field}`,
                    )}
                  </label>
                  <div className="relative">
                    <input
                      id={`profile-${field}`}
                      name={field}
                      type={visible[field] ? 'text' : 'password'}
                      dir="ltr"
                      autoComplete={
                        field === 'currentPassword'
                          ? 'current-password'
                          : 'new-password'
                      }
                      required
                      maxLength={128}
                      aria-invalid={!!errors[field]}
                      aria-describedby={
                        errors[field] ? `profile-${field}-error` : undefined
                      }
                      onChange={({ currentTarget }) => {
                        editedFields.current.add(field);
                        if (currentTarget.form) validate(currentTarget.form);
                      }}
                      className="input h-9 w-full rounded-full! pr-10 rtl:pl-10 rtl:pr-3 aria-invalid:border-error"
                    />
                    <button
                      type="button"
                      className="btn btn-ghost btn-circle btn-xs absolute end-1.5 bottom-1.5"
                      aria-controls={`profile-${field}`}
                      aria-label={t(
                        visible[field] ? 'hidePassword' : 'showPassword',
                      )}
                      onClick={() =>
                        setVisible((previous) => ({
                          ...previous,
                          [field]: !previous[field],
                        }))
                      }
                    >
                      {visible[field] ? (
                        <EyeOff size={17} aria-hidden="true" />
                      ) : (
                        <Eye size={17} aria-hidden="true" />
                      )}
                    </button>
                  </div>
                  {errors[field] && (
                    <p
                      id={`profile-${field}-error`}
                      role="alert"
                      className="text-error"
                    >
                      {errors[field]}
                    </p>
                  )}
                </div>
              ))}
              {message && (
                <p role="alert" className="text-sm text-error">
                  {message}
                </p>
              )}
              <button
                type="submit"
                className="btn btn-success w-fit rounded-full"
              >
                {!busy && <Check aria-hidden="true" className="size-4" />}
                {busy ? t('loading') : t('profile.save')}
              </button>
            </fieldset>
          </form>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button disabled={busy} aria-label={common('close')} tabIndex={-1} />
        </form>
      </dialog>
    </>
  );
}
