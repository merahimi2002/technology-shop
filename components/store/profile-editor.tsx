'use client';

import { useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { Check } from 'lucide-react';
import { GradientButton } from '@/components/gradient-button';
import { profileSchema } from '@/lib/auth/validation';

type ProfileEditorProps = {
  name: string;
  email: string;
  canChangeEmail: boolean;
  onCancel: () => void;
  onSavingChange: (busy: boolean) => void;
  onSave: () => Promise<void>;
};

export function ProfileEditor({
  name,
  email,
  canChangeEmail,
  onCancel,
  onSavingChange,
  onSave,
}: ProfileEditorProps) {
  const t = useTranslations('account');
  const [draftEmail, setDraftEmail] = useState(email);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [nameError, setNameError] = useState('');
  const changingEmail =
    canChangeEmail && draftEmail.trim().toLowerCase() !== email;

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const fields = new FormData(event.currentTarget);
    setNameError('');
    setError('');
    const input = profileSchema.safeParse({
      name: fields.get('name'),
      ...(changingEmail && {
        email: draftEmail,
        currentPassword: fields.get('currentPassword'),
      }),
    });
    if (!input.success) {
      const nameIssue = input.error.issues.find(
        (issue) => issue.path[0] === 'name',
      );
      if (nameIssue) {
        setNameError(
          nameIssue.code === 'too_big'
            ? t('validation.tooLong', { max: Number(nameIssue.maximum) })
            : t('validation.required.name'),
        );
        event.currentTarget
          .querySelector<HTMLInputElement>('[name="name"]')
          ?.focus();
      } else {
        setError(t('profile.invalid'));
      }
      return;
    }

    setBusy(true);
    onSavingChange(true);
    try {
      const response = await fetch('/api/account', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input.data),
      });
      if (response.ok) {
        await onSave();
        return;
      }

      const { error: code } = await response.json();
      switch (code) {
        case 'EMAIL_IN_USE':
          setError(t('profile.emailInUse'));
          break;
        case 'PASSWORD_REQUIRED':
        case 'WRONG_PASSWORD':
          setError(t('profile.wrongPassword'));
          break;
        case 'RATE_LIMITED':
          setError(t('limited'));
          break;
        case 'INVALID_INPUT':
          setError(t('profile.invalid'));
          break;
        case 'ACCOUNT_CHANGED':
        case 'UNAUTHORIZED':
        case 'FORBIDDEN':
          setError(t('profile.accountChanged'));
          break;
        default:
          setError(t('unavailable'));
      }
    } catch {
      setError(t('unavailable'));
    } finally {
      setBusy(false);
      onSavingChange(false);
    }
  }

  return (
    <form noValidate onSubmit={save} aria-busy={busy}>
      <fieldset disabled={busy} className="flex flex-col gap-4">
        <label
          data-account-reveal
          className="flex flex-col gap-1.5 text-sm font-semibold"
        >
          {t('name')}
          <input
            name="name"
            defaultValue={name}
            autoComplete="name"
            maxLength={80}
            required
            aria-invalid={!!nameError}
            aria-describedby={nameError ? 'profile-name-error' : undefined}
            onChange={() => setNameError('')}
            className="input h-9 w-full rounded-full! text-sm font-normal aria-invalid:border-error"
          />
          {nameError && (
            <span
              id="profile-name-error"
              role="alert"
              className="font-normal text-error"
            >
              {nameError}
            </span>
          )}
        </label>
        <label
          data-account-reveal
          className="flex flex-col gap-1.5 text-sm font-semibold"
        >
          {t('email')}
          <input
            name="email"
            value={draftEmail}
            onChange={(event) => setDraftEmail(event.currentTarget.value)}
            type="email"
            dir="ltr"
            autoComplete="email"
            maxLength={254}
            required={canChangeEmail}
            readOnly={!canChangeEmail}
            className="input h-9 w-full rounded-full! text-left text-sm font-normal read-only:cursor-not-allowed read-only:bg-base-200 read-only:opacity-55"
          />
          {!canChangeEmail && (
            <span className="text-xs font-normal text-base-content/70">
              {t('profile.ownerEmail')}
            </span>
          )}
        </label>
        {changingEmail && (
          <label className="flex flex-col gap-1.5 text-sm font-semibold">
            {t('profile.currentPassword')}
            <input
              name="currentPassword"
              type="password"
              dir="ltr"
              autoComplete="current-password"
              maxLength={128}
              required
              className="input h-9 w-full rounded-full! text-sm font-normal"
            />
          </label>
        )}
        {error && (
          <p role="alert" className="text-sm text-error">
            {error}
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <GradientButton
            data-account-reveal
            type="submit"
            icon={busy ? undefined : <Check />}
          >
            {busy ? t('loading') : t('profile.save')}
          </GradientButton>
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-ghost rounded-full"
          >
            {t('profile.cancel')}
          </button>
        </div>
      </fieldset>
    </form>
  );
}
