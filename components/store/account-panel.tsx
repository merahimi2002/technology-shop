'use client';

import { useState, type FormEvent } from 'react';
import { signIn, signOut, useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';

export function AccountPanel() {
  const t = useTranslations('account');
  const { data: session, status } = useSession();
  const [mode, setMode] = useState<'signin' | 'register'>('signin');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<
    'invalid' | 'unavailable' | 'registered' | 'limited' | null
  >(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    setBusy(true);
    setMessage(null);
    try {
      const email = String(data.get('email') ?? '');
      const password = String(data.get('password') ?? '');
      if (mode === 'register') {
        const response = await fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: data.get('name'), email, password }),
        });
        if (!response.ok) {
          setMessage(
            response.status === 429
              ? 'limited'
              : response.status === 400
                ? 'invalid'
                : 'unavailable',
          );
          return;
        }
        form.reset();
        setMode('signin');
        setMessage('registered');
      } else {
        const response = await signIn('credentials', {
          email,
          password,
          redirect: false,
        });
        if (!response?.ok || response.error)
          setMessage(
            response?.error === 'UNAVAILABLE' ? 'unavailable' : 'invalid',
          );
        else form.reset();
      }
    } catch {
      setMessage('unavailable');
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    setBusy(true);
    setMessage(null);
    try {
      await signOut({ redirect: false });
    } catch {
      setMessage('unavailable');
    } finally {
      setBusy(false);
    }
  }

  if (status === 'loading')
    return (
      <p className="py-8" role="status">
        {t('loading')}
      </p>
    );
  if (session?.user) {
    return (
      <div className="flex flex-col gap-5 py-6">
        <p className="text-lg font-semibold break-words">{session.user.name}</p>
        <p className="break-all" dir="ltr">
          {session.user.email}
        </p>
        {message && (
          <p role="alert" className="text-error">
            {t(message)}
          </p>
        )}
        <button
          type="button"
          className="btn btn-neutral"
          disabled={busy}
          onClick={logout}
        >
          {busy ? t('loading') : t('signOut')}
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="flex flex-col gap-5 pt-6"
      aria-busy={busy}
    >
      <p>{mode === 'register' ? t('registerIntro') : t('signInIntro')}</p>
      <fieldset className="flex flex-col gap-4" disabled={busy}>
        {mode === 'register' && (
          <label className="flex flex-col gap-2">
            <span>{t('name')}</span>
            <input
              name="name"
              autoComplete="name"
              className="input w-full"
              required
              maxLength={80}
            />
          </label>
        )}
        <label className="flex flex-col gap-2">
          <span>{t('email')}</span>
          <input
            name="email"
            type="email"
            dir="ltr"
            autoComplete="email"
            className="input w-full"
            required
            maxLength={254}
          />
        </label>
        <label className="flex flex-col gap-2">
          <span>{t('password')}</span>
          <input
            name="password"
            type="password"
            dir="ltr"
            autoComplete={
              mode === 'register' ? 'new-password' : 'current-password'
            }
            className="input w-full"
            required
            minLength={mode === 'register' ? 8 : 1}
            maxLength={128}
            aria-describedby={
              mode === 'register' ? 'account-password-help' : undefined
            }
          />
        </label>
        {mode === 'register' && (
          <p id="account-password-help" className="text-sm">
            {t('passwordHelp')}
          </p>
        )}
        {message && (
          <p
            role={message === 'registered' ? 'status' : 'alert'}
            className={message === 'registered' ? 'text-success' : 'text-error'}
          >
            {t(message)}
          </p>
        )}
        <button className="btn btn-primary w-full" type="submit">
          {busy
            ? t('loading')
            : mode === 'register'
              ? t('register')
              : t('login')}
        </button>
        <button
          className="btn btn-ghost w-full"
          type="button"
          onClick={() => {
            setMode(mode === 'signin' ? 'register' : 'signin');
            setMessage(null);
          }}
        >
          {mode === 'signin' ? t('switchToRegister') : t('switchToSignIn')}
        </button>
      </fieldset>
    </form>
  );
}
