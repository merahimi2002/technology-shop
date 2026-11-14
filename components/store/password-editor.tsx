'use client';

import { useState, type FormEvent } from 'react';
import { LockKeyhole } from 'lucide-react';
import { useTranslations } from 'next-intl';
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
  const [errors, setErrors] = useState<Partial<Record<PasswordField, string>>>(
    {},
  );
  const [message, setMessage] = useState('');

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget;
    const input = changePasswordSchema.safeParse(
      Object.fromEntries(new FormData(form)),
    );
    setMessage('');
    if (!input.success) {
      const nextErrors: typeof errors = {};
      for (const issue of input.error.issues) {
        const field = fields.find((name) => name === issue.path[0]);
        if (!field || nextErrors[field]) continue;
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
        form.reset();
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
    <details
      className="collapse collapse-arrow border border-base-content/15 bg-base-100/30"
      data-account-reveal
    >
      <summary className="collapse-title flex items-center gap-2 text-sm font-semibold">
        <LockKeyhole aria-hidden="true" className="size-4 text-primary" />
        {t('passwordChange.title')}
      </summary>
      <div className="collapse-content">
        <form noValidate onSubmit={save} aria-busy={busy}>
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
                <input
                  id={`profile-${field}`}
                  name={field}
                  type="password"
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
                  onChange={() =>
                    setErrors((previous) => ({
                      ...previous,
                      [field]: undefined,
                    }))
                  }
                  className="input h-9 w-full rounded-full! aria-invalid:border-error"
                />
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
              {busy ? t('loading') : t('passwordChange.title')}
            </button>
          </fieldset>
        </form>
      </div>
    </details>
  );
}
