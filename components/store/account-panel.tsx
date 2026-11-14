'use client';

import {
  useLayoutEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react';
import type { ZodIssue } from 'zod';
import { flushSync } from 'react-dom';
import { signIn, signOut, useSession } from 'next-auth/react';
import {
  Check,
  CircleAlert,
  Eye,
  EyeOff,
  LayoutDashboard,
  LockKeyhole,
  LogIn,
  LogOut,
  Mail,
  Pencil,
  Shield,
  UserPlus,
  UserRound,
  X,
} from 'lucide-react';
import { CircuitBackdrop } from '@/components/circuit-backdrop';
import { canAccessAdmin } from '@/lib/auth/admin-access';
import { ParticleTerrain } from '@/components/particle-terrain';
import { GradientButton } from '@/components/gradient-button';
import { Subtitle } from '@/components/subtitle';
import { Title } from '@/components/title';
import { Logo } from '@/components/logo';
import { ProfileEditor } from '@/components/store/profile-editor';
import { PasswordEditor } from '@/components/store/password-editor';
import { useLocale, useTranslations } from 'next-intl';
import { getSignInReturnPath } from '@/lib/auth/return-path';
import { loginSchema, registerFormSchema } from '@/lib/auth/validation';

type AccountField = keyof typeof registerFormSchema.shape;
type FieldFeedback = { severity: 'warning' | 'error'; message: string };

const titleDelay = 0.18;
const warningDelay = 400;
const sceneTiming = 'motion-safe:duration-1000 motion-safe:ease-out';
const sceneFade = `motion-safe:transition-opacity ${sceneTiming}`;
const fieldIconClass =
  'pointer-events-none absolute start-3 top-1/2 z-10 size-4 -translate-y-1/2';
const fieldIconColors = {
  error: 'text-error',
  warning: 'text-warning',
  idle: 'text-base-content/55',
};
const sceneBadgeClass = `badge badge-soft grid size-8 -translate-y-5 place-items-center rounded-full p-0 md:size-12 md:-translate-y-7 ${sceneFade}`;
// Let the form enter while the shared title is settling.
const fieldsStart = 440;
const fieldStagger = 160;
const revealDuration = 460;
const sheetTiming = { duration: 270, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' };
const tabShapes = {
  signin:
    'polygon(0 0, 44% 0, 45.5% 2%, 46.5% 7%, 47.2% 15%, 52.8% 85%, 53.5% 93%, 54.5% 98%, 56% 100%, 100% 100%, 100% 100%, 0 100%)',
  register:
    'polygon(0 100%, 44% 100%, 45.5% 98%, 46.5% 93%, 47.2% 85%, 52.8% 15%, 53.5% 7%, 54.5% 2%, 56% 0, 100% 0, 100% 100%, 0 100%)',
};

export function AccountPanel() {
  const locale = useLocale();
  const t = useTranslations('account');
  const brand = useTranslations('brand');
  const { data: session, status, update } = useSession();
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [mode, setMode] = useState<'signin' | 'register'>('signin');
  const [field, setField] = useState<AccountField | null>(null);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<AccountField, FieldFeedback>>
  >({});
  const [visible, setVisible] = useState(false);
  const [confirmationVisible, setConfirmationVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<
    | 'invalid'
    | 'unavailable'
    | 'registered'
    | 'limited'
    | 'passwordChanged'
    | null
  >(null);
  const formContent = useRef<HTMLDivElement>(null);
  const folder = useRef<HTMLDivElement>(null);
  const tabSurface = useRef<HTMLSpanElement>(null);
  const sheetAnimations = useRef<Animation[]>([]);
  const hasSwitchedSheet = useRef(false);
  const warningTimers = useRef(new Map<AccountField, number>());

  useLayoutEffect(() => {
    const timers = warningTimers.current;
    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      timers.clear();
    };
  }, [mode, session?.user, status]);

  useLayoutEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const elements = Array.from(
      formContent.current?.querySelectorAll('[data-account-reveal]') ?? [],
    );
    const animations = elements.map((element, index) => {
      const isSubmit = element.matches('button[type=submit]');
      const start = hasSwitchedSheet.current
        ? sheetTiming.duration
        : fieldsStart;
      const delay = start + index * fieldStagger + (isSubmit ? 100 : 0);

      return element.animate(
        [
          {
            clipPath: 'inset(0 -12px 100% -12px round 4px)',
            opacity: 0,
            transform: 'translateY(14px)',
          },
          {
            clipPath: 'inset(-12px -12px -12px -12px round 4px)',
            opacity: 1,
            transform: 'translateY(0)',
          },
        ],
        {
          duration: revealDuration,
          delay,
          fill: 'backwards',
          easing: 'cubic-bezier(0.22, 0.61, 0.36, 1)',
        },
      );
    });

    return () => animations.forEach((animation) => animation.cancel());
  }, [mode, editingProfile, session?.user, status]);

  const activeSheet = session?.user
    ? editingProfile
      ? 'register'
      : 'signin'
    : mode;

  function switchSheet(next: typeof mode, afterSwitch?: () => void) {
    if (next === activeSheet) return;
    const frame = folder.current;
    const surface = tabSurface.current;
    const previousHeight = frame?.getBoundingClientRect().height;
    const previousShape = surface && getComputedStyle(surface).clipPath;
    hasSwitchedSheet.current = true;
    sheetAnimations.current.forEach((animation) => animation.cancel());
    sheetAnimations.current = [];
    flushSync(() => {
      if (session?.user) setEditingProfile(next === 'register');
      else setMode(next);
      setField(null);
      setFieldErrors({});
      setVisible(false);
      setConfirmationVisible(false);
      setMessage(null);
      setProfileSaved(false);
      afterSwitch?.();
    });

    if (
      !frame ||
      previousHeight === undefined ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    )
      return;

    const nextHeight = frame.getBoundingClientRect().height;
    const startTime = document.timeline.currentTime;
    if (previousHeight !== nextHeight) {
      sheetAnimations.current.push(
        frame.animate(
          [{ height: `${previousHeight}px` }, { height: `${nextHeight}px` }],
          sheetTiming,
        ),
      );
    }
    if (surface && previousShape) {
      sheetAnimations.current.push(
        surface.animate(
          [{ clipPath: previousShape }, { clipPath: tabShapes[next] }],
          sheetTiming,
        ),
      );
    }
    sheetAnimations.current.forEach((animation) => {
      animation.startTime = startTime;
    });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    warningTimers.current.forEach((timer) => window.clearTimeout(timer));
    warningTimers.current.clear();
    setField(null);
    const form = event.currentTarget;
    const fields = new FormData(form);
    const schema = mode === 'register' ? registerFormSchema : loginSchema;
    const result = schema.safeParse(Object.fromEntries(fields));
    setMessage(null);
    if (!result.success) {
      const errors: typeof fieldErrors = {};
      for (const issue of result.error.issues) {
        const [name] = issue.path;
        if (
          name !== 'name' &&
          name !== 'email' &&
          name !== 'password' &&
          name !== 'confirmPassword'
        )
          continue;
        errors[name] ??= {
          severity: 'error',
          message: validationMessage(name, issue),
        };
      }
      flushSync(() => setFieldErrors(errors));
      const firstInvalid = form.querySelector<HTMLInputElement>(
        'input[aria-invalid="true"]',
      );
      firstInvalid?.focus();
      return;
    }
    setFieldErrors({});
    setBusy(true);
    let navigating = false;
    try {
      const { email, password } = result.data;
      if (mode === 'register') {
        const response = await fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: fields.get('name'), email, password }),
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
        flushSync(() => {
          setVisible(false);
          setConfirmationVisible(false);
          setMode('signin');
          setMessage('registered');
        });
        const emailInput = form.elements.namedItem('email');
        const passwordInput = form.elements.namedItem('password');
        if (emailInput instanceof HTMLInputElement) emailInput.value = email;
        if (passwordInput instanceof HTMLInputElement)
          passwordInput.value = password;
      } else {
        const returnPath = getSignInReturnPath(
          new URLSearchParams(window.location.search).get('callbackUrl'),
          window.location.origin,
          locale === 'en' ? '/en' : '/',
        );
        const response = await signIn('credentials', {
          email,
          password,
          redirect: false,
          callbackUrl: returnPath,
        });
        if (!response?.ok || response.error) {
          setMessage(
            response?.error === 'UNAVAILABLE' ? 'unavailable' : 'invalid',
          );
        } else {
          window.location.replace(returnPath);
          navigating = true;
        }
      }
    } catch {
      setMessage('unavailable');
    } finally {
      if (!navigating) setBusy(false);
    }
  }

  function validationMessage(name: AccountField, issue: ZodIssue) {
    if (name === 'confirmPassword' && issue.code === 'custom')
      return t('validation.passwordMismatch');
    if (issue.code === 'too_small' && issue.minimum === 8)
      return t('validation.passwordTooShort');
    if (issue.code === 'too_big')
      return t('validation.tooLong', { max: Number(issue.maximum) });
    if (issue.code === 'invalid_format') return t('validation.emailInvalid');
    return t(`validation.required.${name}`);
  }

  function watchField(
    name: AccountField,
    value: string,
    delay: number,
    password?: string,
  ) {
    const timers = warningTimers.current;
    window.clearTimeout(timers.get(name));
    timers.delete(name);
    const schema = registerFormSchema.shape[name];
    const fieldSchema =
      mode === 'signin' && name === 'password'
        ? loginSchema.shape.password
        : schema;
    const result = fieldSchema.safeParse(value);
    const mismatch =
      name === 'confirmPassword' && !!value && value !== password;
    if (result.success && !mismatch) {
      setFieldErrors((errors) =>
        errors[name] ? { ...errors, [name]: undefined } : errors,
      );
      return;
    }
    const message = result.success
      ? t('validation.passwordMismatch')
      : validationMessage(name, result.error.issues[0]);
    function showWarning() {
      timers.delete(name);
      setFieldErrors((errors) =>
        errors[name]?.severity === 'error' && !mismatch
          ? errors
          : {
              ...errors,
              [name]: { severity: mismatch ? 'error' : 'warning', message },
            },
      );
    }
    if (delay) timers.set(name, window.setTimeout(showWarning, delay));
    else showWarning();
  }

  function validationProps(name: AccountField) {
    const severity = fieldErrors[name]?.severity;
    return {
      'aria-invalid': severity === 'error',
      'data-validation': severity,
      'aria-describedby': fieldErrors[name]
        ? `account-${name}-error`
        : undefined,
      onChange: (event: ChangeEvent<HTMLInputElement>) => {
        const { form, value } = event.currentTarget;
        setMessage(null);
        if (severity === 'error')
          setFieldErrors((errors) => ({ ...errors, [name]: undefined }));
        const password = form?.elements.namedItem('password');
        watchField(
          name,
          value,
          name === 'confirmPassword' ? 0 : warningDelay,
          password instanceof HTMLInputElement ? password.value : undefined,
        );
        if (name === 'password' && mode === 'register') {
          const confirmation = form?.elements.namedItem('confirmPassword');
          if (confirmation instanceof HTMLInputElement && confirmation.value)
            watchField('confirmPassword', confirmation.value, 0, value);
        }
      },
      onBlur: (event: React.FocusEvent<HTMLInputElement>) => {
        if (busy) return;
        const { form, value } = event.currentTarget;
        const password = form?.elements.namedItem('password');
        watchField(
          name,
          value,
          0,
          password instanceof HTMLInputElement ? password.value : undefined,
        );
      },
    };
  }

  function fieldError(name: AccountField) {
    const feedback = fieldErrors[name];
    return (
      feedback && (
        <span
          id={`account-${name}-error`}
          role={feedback.severity === 'error' ? 'alert' : 'status'}
          className={`text-sm font-normal ${feedback.severity === 'error' ? 'text-error' : 'text-warning'}`}
        >
          {feedback.message}
        </span>
      )
    );
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

  const heading = session?.user
    ? t(editingProfile ? 'profile.edit' : 'title')
    : t(mode === 'signin' ? 'loginHeading' : 'registerHeading');
  const activeTint = 'bg-white/30 dark:bg-black/45';
  const hasAccount = Boolean(session?.user);
  const showTabs = status !== 'loading' || hasAccount;
  const validation = Object.values(fieldErrors);
  const success = message === 'registered' || message === 'passwordChanged';
  const scene = busy
    ? 'busy'
    : validation.some((item) => item?.severity === 'error') ||
        (message && !success)
      ? 'error'
      : session?.user || success
        ? 'success'
        : validation.some((item) => item?.severity === 'warning')
          ? 'warning'
          : (field ?? mode);
  const feedbackStyles = {
    error: { messageKey: 'errorScene', color: 'text-error' },
    warning: { messageKey: 'warningScene', color: 'text-warning' },
    success: { messageKey: 'successScene', color: 'text-success' },
  } as const;
  const feedback =
    scene === 'error' || scene === 'warning' || scene === 'success'
      ? feedbackStyles[scene]
      : null;
  return (
    <div
      ref={folder}
      className="account-frame relative isolate grid auto-rows-auto [overflow-anchor:none] rounded-[24px] [@media(max-width:1023px)]:rounded-[20px] md:grid-cols-2"
    >
      <ParticleTerrain
        word={feedback ? t(feedback.messageKey) : ''}
        className={`pointer-events-none -z-10 rounded-[inherit] motion-safe:transition-[color] ${sceneTiming} ${feedback?.color ?? 'text-black dark:text-white'}`}
      />
      <div className="relative flex min-h-0 min-w-0 flex-col rounded-[inherit] glass-folder z-0 pb-2 md:rounded-e-none">
        <CircuitBackdrop className="z-[1] rounded-[inherit] opacity-55 [mask-image:linear-gradient(to_left,black,black_35%,transparent)]" />

        {showTabs && (
          <div className="relative grid shrink-0 grid-cols-2 -mb-px overflow-hidden rounded-t-[24px] [@media(max-width:1023px)]:rounded-t-[20px] md:rounded-te-none!">
            {(['signin', 'register'] as const).map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={activeSheet === option}
                disabled={busy}
                className="btn relative z-10 h-11 min-w-0 rounded-none border-0 bg-transparent px-4 font-medium text-base-content/75 shadow-none hover:bg-transparent hover:text-base-content focus-visible:outline-offset-[-3px] aria-pressed:font-bold aria-pressed:backdrop-blur-[3px] aria-pressed:text-black aria-pressed:hover:text-black dark:aria-pressed:text-white dark:aria-pressed:hover:text-white"
                onClick={() => switchSheet(option)}
              >
                {session?.user
                  ? t(option === 'signin' ? 'title' : 'profile.edit')
                  : t(option === 'signin' ? 'login' : 'registerTab')}
              </button>
            ))}
            <span
              aria-hidden="true"
              ref={tabSurface}
              className={`pointer-events-none absolute inset-0 z-[2] ${activeTint} rtl:-scale-x-100`}
              style={{ clipPath: tabShapes[activeSheet] }}
            />
          </div>
        )}
        <div
          ref={formContent}
          className={`relative z-30 flex flex-1 flex-col justify-center isolate overflow-hidden rounded-b-[24px] [@media(max-width:1023px)]:rounded-b-[20px] px-5 py-6 motion-safe:transition-[margin-inline-start,margin-inline-end,border-radius] motion-safe:duration-[270ms] motion-safe:ease-[cubic-bezier(0.4,0,0.2,1)] sm:px-11 sm:py-8 md:px-9 lg:px-15 ${showTabs ? activeTint + ' min-h-[35rem] backdrop-blur-[3px]' : 'rounded-t-[inherit] bg-white/8 min-h-[calc(35rem+2.75rem-1px)]'} ${showTabs && (activeSheet === 'signin' ? 'ms-0 me-2 rounded-ss-none rounded-se-[24px] [@media(max-width:1023px)]:rounded-se-[20px]' : 'ms-2 me-0 rounded-ss-[24px] [@media(max-width:1023px)]:rounded-ss-[20px] rounded-se-none')}`}
        >
          <Subtitle
            icon={
              mode === 'register' && !session?.user ? (
                <UserPlus />
              ) : session?.user ? (
                editingProfile ? (
                  <Pencil />
                ) : (
                  <UserRound />
                )
              ) : (
                <LogIn />
              )
            }
            className="mb-1"
          >
            {t(
              session?.user
                ? 'accountSubtitle'
                : mode === 'register'
                  ? 'registerSubtitle'
                  : 'loginSubtitle',
            )}
          </Subtitle>
          <Title as="h1" delay={titleDelay}>
            {heading}
          </Title>
          {!showTabs ? (
            <div
              className="mt-4 grid min-h-16 place-items-center text-primary"
              role="status"
            >
              <span className="sr-only">{t('loading')}</span>
              <span
                aria-hidden="true"
                className="loading loading-spinner loading-md motion-reduce:animate-none"
              />
            </div>
          ) : session?.user && editingProfile ? (
            <div key={session.user.id} className="mt-5 flex flex-col gap-4">
              <ProfileEditor
                name={session.user.name ?? ''}
                email={session.user.email ?? ''}
                busy={busy}
                onCancel={() => switchSheet('signin')}
                onSavingChange={setBusy}
                onSave={async () => {
                  const refreshed = await update({});
                  if (!refreshed?.user) {
                    window.location.reload();
                    return;
                  }
                  switchSheet('signin', () => setProfileSaved(true));
                }}
              />
              {session.user.role === 'OWNER' ? (
                <p data-account-reveal className="text-sm text-base-content/75">
                  {t('passwordChange.owner')}
                </p>
              ) : (
                <PasswordEditor
                  busy={busy}
                  onSavingChange={setBusy}
                  onChanged={async () => {
                    await signOut({ redirect: false });
                    setEditingProfile(false);
                    setMode('signin');
                    setMessage('passwordChanged');
                  }}
                />
              )}
            </div>
          ) : session?.user ? (
            <div className="mt-5 flex flex-col gap-4">
              {session.user.name && (
                <p
                  data-account-reveal
                  className="flex items-center gap-2 text-lg font-normal"
                >
                  <UserRound
                    aria-hidden="true"
                    className="size-4 shrink-0 text-primary"
                  />
                  <bdi className="min-w-0 break-words">{session.user.name}</bdi>
                </p>
              )}
              <p
                data-account-reveal
                className="flex items-center gap-2 text-left rtl:text-right"
              >
                <Mail
                  aria-hidden="true"
                  className="size-4 shrink-0 text-primary"
                />
                <bdi className="min-w-0 break-all" dir="ltr">
                  {session.user.email}
                </bdi>
              </p>
              <p data-account-reveal className="flex items-center gap-2">
                <Shield
                  aria-hidden="true"
                  className="size-4 shrink-0 text-primary"
                />
                {t('roleLabel', { role: t(`roles.${session.user.role}`) })}
              </p>
              {message && (
                <p role="alert" className="text-error">
                  {t(message)}
                </p>
              )}
              {profileSaved && (
                <p role="status" className="text-sm text-success">
                  {t('profile.saved')}
                </p>
              )}
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {canAccessAdmin(session.user.role) && (
                  <GradientButton
                    data-account-reveal
                    href={`/${locale}/admin`}
                    className="w-fit"
                    icon={<LayoutDashboard />}
                  >
                    {t('adminPanel')}
                  </GradientButton>
                )}
                <button
                  data-account-reveal
                  className="btn btn-error h-10 w-fit rounded-full"
                  type="button"
                  disabled={busy}
                  aria-busy={busy}
                  aria-label={busy ? t('loading') : undefined}
                  onClick={logout}
                >
                  {busy ? (
                    <span
                      aria-hidden="true"
                      className="loading loading-spinner loading-sm motion-reduce:animate-none"
                    />
                  ) : (
                    <>
                      <LogOut aria-hidden="true" className="size-4" />
                      {t('signOut')}
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <>
              <form
                noValidate
                onSubmit={submit}
                className="mt-5"
                aria-busy={busy}
                onBlur={() => setField(null)}
              >
                <fieldset className="flex flex-col gap-4" disabled={busy}>
                  {mode === 'register' && (
                    <div
                      data-account-reveal
                      className="flex flex-col gap-1.5 text-sm font-semibold"
                    >
                      <label htmlFor="account-name">{t('name')}</label>
                      <div className="relative">
                        <UserRound
                          aria-hidden="true"
                          className={`${fieldIconClass} ${fieldIconColors[fieldErrors.name?.severity ?? 'idle']}`}
                        />
                        <input
                          id="account-name"
                          name="name"
                          placeholder={t('namePlaceholder')}
                          autoComplete="name"
                          className="input h-9 w-full rounded-full! ps-9 placeholder:text-xs placeholder:text-base-content/55 text-sm font-normal aria-invalid:border-error data-[validation=warning]:border-warning"
                          required
                          {...validationProps('name')}
                          onFocus={() => setField('name')}
                        />
                      </div>
                      {fieldError('name')}
                    </div>
                  )}
                  <div
                    data-account-reveal
                    className="flex flex-col gap-1.5 text-sm font-semibold"
                  >
                    <label htmlFor="account-email">{t('email')}</label>
                    <div className="relative">
                      <Mail
                        aria-hidden="true"
                        className={`${fieldIconClass} ${fieldIconColors[fieldErrors.email?.severity ?? 'idle']}`}
                      />
                      <input
                        id="account-email"
                        name="email"
                        placeholder={t('emailPlaceholder')}
                        type="email"
                        dir="ltr"
                        autoComplete="email"
                        className="input h-9 w-full rounded-full! pl-9 rtl:pl-3 rtl:pr-9 placeholder:text-xs placeholder:text-base-content/55 text-sm font-normal text-left rtl:placeholder:text-right aria-invalid:border-error data-[validation=warning]:border-warning"
                        required
                        {...validationProps('email')}
                        onFocus={() => setField('email')}
                      />
                    </div>
                    {fieldError('email')}
                  </div>
                  <div data-account-reveal className="flex flex-col gap-1.5">
                    <div className="relative flex flex-col gap-1.5">
                      <label
                        htmlFor="account-password"
                        className="text-sm font-semibold"
                      >
                        {t('password')}
                      </label>
                      <div className="relative">
                        <LockKeyhole
                          aria-hidden="true"
                          className={`${fieldIconClass} ${fieldIconColors[fieldErrors.password?.severity ?? 'idle']}`}
                        />
                        <input
                          id="account-password"
                          key={mode}
                          name="password"
                          placeholder={t('passwordPlaceholder')}
                          type={visible ? 'text' : 'password'}
                          dir="ltr"
                          autoComplete={
                            mode === 'register'
                              ? 'new-password'
                              : 'current-password'
                          }
                          className="input h-9 w-full rounded-full! placeholder:text-xs placeholder:text-base-content/55 pl-9 pr-12 text-sm rtl:pr-9 rtl:pl-12 rtl:placeholder:text-right aria-invalid:border-error data-[validation=warning]:border-warning"
                          required
                          {...validationProps('password')}
                          onFocus={() => setField('password')}
                        />
                        <button
                          type="button"
                          className="btn btn-ghost btn-circle btn-xs absolute end-1.5 bottom-1.5"
                          aria-label={t(
                            visible ? 'hidePassword' : 'showPassword',
                          )}
                          onFocus={() => setField('password')}
                          onClick={() => setVisible(!visible)}
                        >
                          {visible ? (
                            <EyeOff size={17} aria-hidden="true" />
                          ) : (
                            <Eye size={17} aria-hidden="true" />
                          )}
                        </button>
                      </div>
                    </div>
                    {fieldError('password')}
                  </div>
                  {mode === 'register' && (
                    <div
                      data-account-reveal
                      className="flex flex-col gap-1.5 text-sm font-semibold"
                    >
                      <label htmlFor="account-confirmPassword">
                        {t('confirmPassword')}
                      </label>
                      <div className="relative">
                        <LockKeyhole
                          aria-hidden="true"
                          className={`${fieldIconClass} ${fieldIconColors[fieldErrors.confirmPassword?.severity ?? 'idle']}`}
                        />
                        <input
                          id="account-confirmPassword"
                          name="confirmPassword"
                          type={confirmationVisible ? 'text' : 'password'}
                          dir="ltr"
                          autoComplete="new-password"
                          className="input h-9 w-full rounded-full! pl-9 pr-12 rtl:pr-9 rtl:pl-12 text-sm font-normal aria-invalid:border-error data-[validation=warning]:border-warning"
                          required
                          {...validationProps('confirmPassword')}
                          onFocus={() => setField('confirmPassword')}
                        />
                        <button
                          type="button"
                          className="btn btn-ghost btn-circle btn-xs absolute end-1.5 bottom-1.5"
                          aria-controls="account-confirmPassword"
                          aria-label={t(
                            confirmationVisible
                              ? 'hidePassword'
                              : 'showPassword',
                          )}
                          onClick={() =>
                            setConfirmationVisible(!confirmationVisible)
                          }
                        >
                          {confirmationVisible ? (
                            <EyeOff size={17} aria-hidden="true" />
                          ) : (
                            <Eye size={17} aria-hidden="true" />
                          )}
                        </button>
                      </div>
                      {fieldError('confirmPassword')}
                    </div>
                  )}
                  {message && (
                    <p
                      role={success ? 'status' : 'alert'}
                      className={success ? 'text-success' : 'text-error'}
                    >
                      {t(message)}
                    </p>
                  )}
                  <GradientButton
                    data-account-reveal
                    className="mt-3 w-fit self-center"
                    type="submit"
                    aria-label={busy ? t('loading') : undefined}
                    icon={
                      busy ? undefined : mode === 'signin' ? (
                        <LogIn />
                      ) : (
                        <UserPlus className="ltr:rotate-180" />
                      )
                    }
                  >
                    {busy ? (
                      <span
                        className="loading loading-spinner loading-sm motion-reduce:animate-none"
                        aria-hidden="true"
                      />
                    ) : (
                      t(mode === 'signin' ? 'login' : 'register')
                    )}
                  </GradientButton>
                </fieldset>
              </form>
            </>
          )}
        </div>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 z-40 h-2 rounded-b-[24px] [@media(max-width:1023px)]:rounded-b-[20px] bg-inherit md:rounded-ee-none"
        />
      </div>
      <div
        aria-hidden="true"
        data-scene={scene}
        className="pointer-events-none relative z-20 text-base-content md:min-h-36"
      >
        <div className="min-h-0 overflow-hidden md:absolute md:inset-0">
          <div className="relative min-h-28 md:h-full">
            <div className="absolute inset-0 grid place-items-center *:col-start-1 *:row-start-1">
              <span
                className={`${sceneBadgeClass} badge-error ${scene === 'error' ? 'opacity-100' : 'opacity-0'}`}
              >
                <X className="size-5 md:size-7" />
              </span>
              <span
                className={`${sceneBadgeClass} badge-success ${scene === 'success' ? 'opacity-100' : 'opacity-0'}`}
              >
                <Check className="size-5 md:size-7" />
              </span>
              <span
                className={`${sceneBadgeClass} badge-warning ${scene === 'warning' ? 'opacity-100' : 'opacity-0'}`}
              >
                <CircleAlert className="size-5 md:size-7" />
              </span>
              <Logo
                label={brand('name')}
                primaryColor="currentColor"
                secondaryColor="currentColor"
                className={`size-9 md:size-16 ${sceneFade} ${feedback ? 'opacity-0' : 'opacity-0 md:opacity-100'}`}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
