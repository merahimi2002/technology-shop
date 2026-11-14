'use client';

import { RequiredFieldLabel } from './required-field-label';
import { useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { Check, X } from 'lucide-react';
import { profileSchema } from '@/lib/auth/validation';
import { ProfilePhotoEditor } from './profile-photo-editor';

type ProfileEditorProps = {
  name: string;
  email: string;
  image?: string | null;
  previewTarget: HTMLElement | null;
  busy: boolean;
  onCancel: () => void;
  onSavingChange: (busy: boolean) => void;
  onErrorChange: (hasError: boolean) => void;
  onSave: () => Promise<void>;
};

export function ProfileEditor({
  name,
  email,
  image,
  previewTarget,
  busy,
  onCancel,
  onSavingChange,
  onErrorChange,
  onSave,
}: ProfileEditorProps) {
  const t = useTranslations('account');
  const [error, setError] = useState('');
  const [nameError, setNameError] = useState('');
  const [avatar, setAvatar] = useState<string | null>();

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const fields = new FormData(event.currentTarget);
    setNameError('');
    setError('');
    onErrorChange(false);
    const input = profileSchema.safeParse({
      name: fields.get('name'),
    });
    if (!input.success) {
      onErrorChange(true);
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

    onSavingChange(true);
    try {
      const response = await fetch('/api/account', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...input.data, avatar }),
      });
      if (response.ok) {
        await onSave();
        return;
      }

      const { error: code } = await response.json();
      onErrorChange(true);
      switch (code) {
        case 'INVALID_AVATAR':
          setError(t('profile.invalidAvatar'));
          break;
        case 'INVALID_INPUT':
          setError(t('profile.invalid'));
          break;
        case 'ACCOUNT_CHANGED':
        case 'UNAUTHORIZED':
          setError(t('profile.accountChanged'));
          break;
        default:
          setError(t('unavailable'));
      }
    } catch {
      onErrorChange(true);
      setError(t('unavailable'));
    } finally {
      onSavingChange(false);
    }
  }

  return (
    <>
      <ProfilePhotoEditor
        avatar={avatar}
        setAvatar={setAvatar}
        name={name}
        image={image}
        previewTarget={previewTarget}
        busy={busy}
      />
      <form noValidate onSubmit={save} aria-busy={busy}>
        <fieldset disabled={busy} className="flex flex-col gap-4">
          <label
            data-account-reveal
            className="flex flex-col gap-1.5 text-sm font-semibold"
          >
            <RequiredFieldLabel>{t('name')}</RequiredFieldLabel>
            <input
              name="name"
              defaultValue={name}
              autoComplete="name"
              maxLength={80}
              required
              aria-invalid={!!nameError}
              aria-describedby={nameError ? 'profile-name-error' : undefined}
              onChange={() => {
                setNameError('');
                setError('');
                onErrorChange(false);
              }}
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
              value={email}
              type="email"
              dir="ltr"
              autoComplete="email"
              readOnly
              className="input h-9 w-full rounded-full! text-left text-sm font-normal read-only:cursor-not-allowed read-only:bg-base-200 read-only:opacity-55"
            />
          </label>
          {error && (
            <p role="alert" className="text-sm text-error">
              {error}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <button
              data-account-reveal
              type="submit"
              className="btn btn-success rounded-full"
            >
              {!busy && <Check aria-hidden="true" className="size-4" />}
              {busy ? t('loading') : t('profile.save')}
            </button>
            <button
              data-account-reveal
              type="button"
              onClick={onCancel}
              className="btn btn-soft btn-error rounded-full"
            >
              <X aria-hidden="true" className="size-4" />
              {t('profile.cancel')}
            </button>
          </div>
        </fieldset>
      </form>
    </>
  );
}
