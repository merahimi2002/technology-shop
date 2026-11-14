'use client';

import { useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { profileSchema } from '@/lib/auth/validation';

type ProfileEditorProps = {
  name: string;
  email: string;
  canChangeEmail: boolean;
  onCancel: () => void;
  onSave: () => Promise<void>;
};

export function ProfileEditor({
  name,
  email,
  canChangeEmail,
  onCancel,
  onSave,
}: ProfileEditorProps) {
  const t = useTranslations('account');
  const [draftEmail, setDraftEmail] = useState(email);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const changingEmail =
    canChangeEmail && draftEmail.trim().toLowerCase() !== email;

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const fields = new FormData(event.currentTarget);
    const input = profileSchema.safeParse({
      name: fields.get('name'),
      ...(changingEmail && {
        email: draftEmail,
        currentPassword: fields.get('currentPassword'),
      }),
    });
    if (!input.success) {
      setError(t('profile.invalid'));
      return;
    }

    setError('');
    setBusy(true);
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
    }
  }

  return (
    <form onSubmit={save} aria-busy={busy}>
      <fieldset disabled={busy} className="flex flex-col gap-4">
        <legend className="mb-4 text-lg font-semibold">
          {t('profile.edit')}
        </legend>
        <label className="flex flex-col gap-1.5 text-sm font-semibold">
          {t('name')}
          <input
            name="name"
            defaultValue={name}
            autoComplete="name"
            maxLength={80}
            required
            className="input h-9 w-full rounded-full! text-sm font-normal"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-semibold">
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
            className="input h-9 w-full rounded-full! text-left text-sm font-normal read-only:bg-base-200"
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
          <button type="submit" className="btn btn-primary rounded-full">
            {busy ? t('loading') : t('profile.save')}
          </button>
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
