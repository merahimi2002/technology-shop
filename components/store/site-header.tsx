'use client';
import { useTranslations } from 'next-intl';

import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import { useLocale } from 'next-intl';
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type RefObject,
} from 'react';
import {
  ArrowUpLeft,
  ChevronDown,
  Gamepad2,
  Headphones,
  Heart,
  Laptop,
  LayoutDashboard,
  LayoutGrid,
  LogOut,
  Menu,
  Search,
  ShoppingBag,
  Smartphone,
  Palette,
  UserRound,
  Pencil,
  Usb,
} from 'lucide-react';
import { ModalCloseButton } from '@/components/modal-close-button';
import { AccountAvatar } from '@/components/store/account-avatar';
import { AccountRoleBadge } from '@/components/store/account-role-badge';
import { canAccessAdmin } from '@/lib/auth/admin-access';
import { GradientButton } from '@/components/gradient-button';
import { Logo } from '@/components/logo';
import { LanguageSwitcher } from '@/components/language-switcher';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { ThemeToggle } from '@/components/theme-toggle';
import { STORE_CATEGORIES } from '@/lib/store-navigation';
import { useRouter } from 'next/navigation';

const actionButtonClass =
  'btn btn-ghost btn-circle h-8 min-h-8 w-8 border-0 bg-base-content/7 p-0 shadow-none [@media(hover:hover)_and_(pointer:fine)]:hover:bg-[conic-gradient(from_90deg,var(--color-primary)_0%,var(--color-secondary)_50%,var(--color-primary)_100%)] [@media(hover:hover)_and_(pointer:fine)]:hover:text-primary-content';

const icons = {
  phone: Smartphone,
  laptop: Laptop,
  audio: Headphones,
  gaming: Gamepad2,
  accessories: Usb,
};

function SearchForm({
  inputRef,
  onSearch,
}: {
  inputRef?: RefObject<HTMLInputElement | null>;
  onSearch: (query: string) => void;
}) {
  const t = useTranslations();
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const query = String(data.get('q') ?? '').trim();
    if (query) onSearch(query);
  }
  return (
    <form
      role="search"
      onSubmit={submit}
      className="header-search border border-base-content/8 bg-base-200/66 shadow-none focus-within:outline-2 focus-within:outline-secondary [&_input::placeholder]:text-base-content/48 [&_input:focus]:outline-none flex w-full h-12 gap-3 px-[16px_5px] rounded-[13px] outline-offset-[3px] [&_input]:min-w-0 [&_input]:w-full [&_input]:h-full [&_input]:text-[13px] [@media(max-width:1023px)]:h-11 input"
    >
      <Search
        size={20}
        className="shrink-0 text-secondary"
        aria-hidden="true"
      />
      <input
        ref={inputRef}
        name="q"
        type="search"
        maxLength={120}
        required
        aria-label={t('search.title')}
        placeholder={t('search.placeholder')}
        autoComplete="off"
      />
      <kbd className="hidden text-base-content/40 lg:block" aria-hidden="true">
        {t('search.shortcut')}
      </kbd>
      <button
        className="search-submit min-h-9 h-9 w-9 rounded-[9px] btn btn-ghost btn-square"
        type="submit"
        aria-label={t('search.submit')}
      >
        <ArrowUpLeft className="ltr:rotate-90" size={19} />
      </button>
    </form>
  );
}

export function SiteHeader() {
  const locale = useLocale();
  const t = useTranslations();
  const { data: session, status } = useSession();
  const accountUser = status === 'authenticated' ? session?.user : undefined;
  const showAdminLink = accountUser ? canAccessAdmin(accountUser.role) : false;
  const accountHref = `/${locale}/account`;
  const account = useRef<HTMLDialogElement>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [signOutFailed, setSignOutFailed] = useState(false);
  const mobileMenu = useRef<HTMLDialogElement>(null);
  const preferences = useRef<HTMLDialogElement>(null);
  const cart = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const results = useRef<HTMLDialogElement>(null);
  const searchDialog = useRef<HTMLDialogElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const categoryMenu = useRef<HTMLDetailsElement>(null);
  const [result, setResult] = useState({
    title: t('navigation.products'),
    detail: '',
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('account') === 'signin') {
      const callbackUrl = params.get('callbackUrl');
      const query = callbackUrl
        ? `?${new URLSearchParams({ callbackUrl })}`
        : '';
      router.replace(`/${locale}/account${query}`);
    }
    function shortcuts(event: KeyboardEvent) {
      if (event.key === 'Escape' && categoryMenu.current)
        categoryMenu.current.open = false;
      const target = event.target;
      if (
        event.key !== '/' ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        document.querySelector('dialog[open]') ||
        (target instanceof HTMLElement &&
          (target.isContentEditable ||
            target.closest('input, textarea, select')))
      )
        return;
      event.preventDefault();
      searchDialog.current?.showModal();
      searchInput.current?.focus();
    }
    document.addEventListener('keydown', shortcuts);
    return () => document.removeEventListener('keydown', shortcuts);
  }, [locale, router]);

  function showResults(title: string, detail: string) {
    setResult({ title, detail });
    categoryMenu.current?.removeAttribute('open');
    mobileMenu.current?.close();
    searchDialog.current?.close();
    results.current?.showModal();
  }
  const search = (query: string) =>
    showResults(t('search.resultsTitle', { query }), t('search.empty'));
  const category = (label: string) =>
    showResults(label, t('categories.comingSoon'));

  async function logout() {
    setSigningOut(true);
    setSignOutFailed(false);
    try {
      await signOut({ redirect: false });
      account.current?.close();
    } catch {
      setSignOutFailed(true);
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <>
      <a
        href="#main-content"
        className="skip-link focus:top-3 fixed -top-[100px] start-6 z-[100] btn btn-primary"
      >
        {t('common.skipToContent')}
      </a>
      <header
        className="store-header sticky top-5 z-[30] w-[calc(100%_-_64px)] [margin:24px_auto_0] [@media(max-width:1023px)]:top-3 [@media(max-width:1023px)]:w-[calc(100%_-_40px)] [@media(max-width:1023px)]:mt-4"
        aria-label={t('header.label')}
      >
        <div className="glass-header rounded-[24px] [@media(max-width:1023px)]:rounded-[20px]">
          <div className="navbar header-main flex-wrap lg:flex-nowrap gap-4 xl:gap-7 min-h-[98px] px-7 py-4 [@media(max-width:1023px)]:gap-2.5 [@media(max-width:1023px)]:min-h-[82px] [@media(max-width:1023px)]:px-4 [@media(max-width:1023px)]:py-3 [@media(max-width:390px)]:px-[10px] [@media(max-width:390px)]:gap-0.5">
            <button
              className="btn btn-ghost btn-square lg:hidden"
              type="button"
              aria-label={t('navigation.openMenu')}
              aria-controls="store-mobile-menu"
              onClick={() => mobileMenu.current?.showModal()}
            >
              <Menu size={23} strokeWidth={1.7} />
            </button>
            <Link
              href={locale === 'en' ? '/en' : '/'}
              className="brand-link flex items-center gap-0.5 shrink-0 no-underline [@media(max-width:1023px)]:me-auto [@media(max-width:1023px)]:[&_svg]:w-[49px] [@media(max-width:1023px)]:[&_svg]:h-[49px] [@media(max-width:390px)]:gap-0 [@media(max-width:390px)]:[&_svg]:w-[42px] [@media(max-width:390px)]:[&_svg]:h-[42px]"
              aria-label={t('brand.homeLabel')}
            >
              <Logo
                label={t('brand.name')}
                width={62}
                height={62}
                aria-hidden="true"
              />
              <span className="brand-type flex flex-col gap-0.5 [&_strong]:text-[26px] [&_strong]:font-bold [&_strong]:leading-[1.2] [&_strong]:tracking-[-1px] [&_strong]:whitespace-nowrap [&>_span]:text-[9px] [&>_span]:font-semibold [&>_span]:tracking-[3px] [@media(max-width:1023px)]:[&_strong]:text-[23px] [@media(max-width:1023px)]:[&>_span]:text-[7px] [@media(max-width:1023px)]:[&>_span]:tracking-[2px] [@media(max-width:390px)]:[&_strong]:text-[21px]">
                <strong>
                  {t('brand.name')}
                  <span className="brand-dot text-secondary">
                    {t('brand.dot')}
                  </span>
                </strong>
              </span>
            </Link>
            <div className="header-nav hidden min-w-0 flex-1 items-center justify-center xl:justify-start lg:flex">
              <nav
                aria-label={t('navigation.label')}
                className="nav-links flex items-center gap-4 xl:gap-7 min-w-0"
              >
                <details
                  ref={categoryMenu}
                  className="dropdown category-dropdown shrink-0"
                  onBlur={(event) => {
                    if (!event.currentTarget.contains(event.relatedTarget))
                      event.currentTarget.open = false;
                  }}
                >
                  <summary className="btn btn-ghost category-trigger border-0 bg-transparent shadow-none [&::marker]:hidden [&::-webkit-details-marker]:hidden [&>svg:last-child]:ms-1 h-[38px] min-h-[38px] p-0 gap-[9px] text-[13px] font-semibold text-secondary">
                    <LayoutGrid size={18} />
                    <span>{t('navigation.categories')}</span>
                    <ChevronDown size={15} />
                  </summary>
                  <ul
                    className="dropdown-content menu category-menu border border-base-300 [&_button>svg:first-child]:text-secondary min-w-70 mt-[17px] p-2.5 rounded-[16px] bg-base-100 [&_button]:min-h-12 [&_button]:gap-3.5 [&_button]:text-[13px]"
                    aria-label={t('navigation.categories')}
                  >
                    {STORE_CATEGORIES.map((item) => {
                      const Icon = icons[item.icon];
                      return (
                        <li key={item.slug}>
                          <button
                            type="button"
                            aria-label={t(item.labelKey)}
                            onClick={() => category(t(item.labelKey))}
                          >
                            <Icon size={19} />
                            <span>{t(item.labelKey)}</span>
                            <ArrowUpLeft
                              size={15}
                              className="ms-auto text-base-content/35 ltr:rotate-90"
                            />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </details>
                <span
                  className="nav-divider bg-base-content/12 h-[17px] w-[1px]"
                  aria-hidden="true"
                />
                <button
                  className="nav-link hover:text-secondary flex items-center gap-[7px] min-h-[38px] text-[13px] whitespace-nowrap cursor-pointer"
                  type="button"
                  onClick={() =>
                    showResults(t('navigation.allProducts'), t('search.empty'))
                  }
                >
                  {t('navigation.allProducts')}
                </button>
                <button
                  className="nav-link hover:text-secondary flex items-center gap-[7px] min-h-[38px] text-[13px] whitespace-nowrap cursor-pointer"
                  type="button"
                  onClick={() =>
                    showResults(
                      t('navigation.newArrivals'),
                      t('navigation.newArrivalsEmpty'),
                    )
                  }
                >
                  {t('navigation.newArrivals')}
                </button>
                <button
                  className="nav-link hover:text-secondary flex items-center gap-[7px] min-h-[38px] text-[13px] whitespace-nowrap cursor-pointer"
                  type="button"
                  onClick={() =>
                    showResults(
                      t('navigation.specialOffers'),
                      t('navigation.offersEmpty'),
                    )
                  }
                >
                  {t('navigation.specialOffers')}
                  <span
                    className="offer-dot h-[5px] w-[5px] rounded-full bg-secondary"
                    aria-hidden="true"
                  />
                </button>
              </nav>
            </div>
            <div className="header-actions flex shrink-0 items-center gap-0.5 max-lg:w-full max-lg:justify-end">
              <LanguageSwitcher />
              <ThemeToggle />
              <button
                type="button"
                className={`appearance-button ${actionButtonClass}`}
                onClick={() => preferences.current?.showModal()}
                aria-label={t('theme.title')}
                title={t('theme.title')}
              >
                <Palette size={18} strokeWidth={1.7} />
              </button>
              <button
                type="button"
                className={`cart-button ${actionButtonClass}`}
                onClick={() => cart.current?.showModal()}
                aria-label={t('cart.emptyLabel')}
                title={t('cart.title')}
              >
                <ShoppingBag size={18} strokeWidth={1.7} />
              </button>
              <button
                type="button"
                className={`favorites-button ${actionButtonClass}`}
                onClick={() =>
                  showResults(t('wishlist.title'), t('wishlist.empty'))
                }
                aria-label={t('wishlist.title')}
                title={t('wishlist.title')}
              >
                <Heart size={18} strokeWidth={1.7} />
              </button>
              {status === 'loading' || accountUser ? (
                <button
                  type="button"
                  className={`${actionButtonClass}${accountUser ? ' avatar avatar-online' : ''}`}
                  aria-label={t('account.title')}
                  title={t('account.title')}
                  aria-haspopup={accountUser ? 'dialog' : undefined}
                  aria-controls={accountUser ? 'store-account' : undefined}
                  disabled={status === 'loading'}
                  onClick={() => {
                    setSignOutFailed(false);
                    account.current?.showModal();
                  }}
                >
                  {accountUser ? (
                    <AccountAvatar
                      key={accountUser.image}
                      image={accountUser.image}
                      name={accountUser.name}
                      size={32}
                    />
                  ) : (
                    <UserRound size={18} strokeWidth={1.7} aria-hidden="true" />
                  )}
                </button>
              ) : (
                <Link
                  href={accountHref}
                  className={actionButtonClass}
                  aria-label={t('account.signIn')}
                  title={t('account.signIn')}
                >
                  <UserRound size={18} strokeWidth={1.7} aria-hidden="true" />
                </Link>
              )}
              <button
                type="button"
                className={actionButtonClass}
                aria-label={t('search.open')}
                title={t('search.submit')}
                onClick={() => {
                  searchDialog.current?.showModal();
                  searchInput.current?.focus();
                }}
              >
                <Search size={18} strokeWidth={1.7} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <dialog
        id="store-mobile-menu"
        ref={mobileMenu}
        className="modal mobile-menu-dialog"
        aria-labelledby="mobile-menu-title"
      >
        <div className="modal-box mobile-sheet absolute inset-y-0 start-0 m-0 w-[min(88vw,_360px)] max-h-[100dvh] h-[100dvh] p-6 rounded-none overscroll-contain">
          <div className="flex items-center justify-between">
            <h2 id="mobile-menu-title" className="text-xl font-bold">
              {t('brand.name')}
              <span className="text-secondary">{t('brand.dot')}</span>
            </h2>
            <ModalCloseButton label={t('navigation.closeMenu')} />{' '}
          </div>
          <p className="mt-7 mb-3 text-sm text-base-content/55">
            {t('navigation.categories')}
          </p>
          <ul className="menu w-full gap-2 p-0">
            {STORE_CATEGORIES.map((item) => {
              const Icon = icons[item.icon];
              return (
                <li key={item.slug}>
                  <button
                    aria-label={t(item.labelKey)}
                    onClick={() => category(t(item.labelKey))}
                    className="min-h-12"
                  >
                    <Icon size={21} className="text-secondary" />
                    {t(item.labelKey)}
                    <ArrowUpLeft
                      size={16}
                      className="ms-auto opacity-40 ltr:rotate-90"
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button aria-label={t('navigation.closeStoreMenu')}>
            {t('common.close')}
          </button>
        </form>
      </dialog>

      <dialog
        ref={searchDialog}
        className="modal"
        aria-labelledby="search-title"
      >
        <div className="modal-box">
          <DialogHeading id="search-title" title={t('search.title')} />
          <div className="mt-5">
            <SearchForm inputRef={searchInput} onSearch={search} />
          </div>
        </div>
        <Backdrop />
      </dialog>

      <dialog
        ref={preferences}
        className="modal"
        aria-labelledby="appearance-title"
      >
        <div className="modal-box w-[min(440px,calc(100vw-32px))] max-w-none p-5">
          <DialogHeading id="appearance-title" title={t('theme.title')} />
          <ThemeSwitcher />
        </div>
        <Backdrop />
      </dialog>
      {accountUser && (
        <dialog
          id="store-account"
          ref={account}
          className="modal"
          aria-labelledby="store-account-title"
        >
          <div className="modal-box max-w-sm max-[360px]:px-3">
            <DialogHeading
              id="store-account-title"
              title={t('account.title')}
            />
            <div className="mt-5 flex items-center gap-3">
              <div className="avatar size-14 shrink-0 text-xl">
                <AccountAvatar
                  key={accountUser.image}
                  image={accountUser.image}
                  name={accountUser.name}
                  size={56}
                />
              </div>
              <div className="min-w-0 flex-1 text-start">
                <p
                  className="truncate font-semibold"
                  title={accountUser.name || undefined}
                >
                  <bdi>{accountUser.name || t('account.accountSubtitle')}</bdi>
                </p>
                {accountUser.email && (
                  <p
                    className="mt-1 truncate text-sm text-base-content/70"
                    title={accountUser.email}
                  >
                    <bdi dir="ltr">{accountUser.email}</bdi>
                  </p>
                )}
              </div>
              <div className="shrink-0">
                <AccountRoleBadge role={accountUser.role} />
              </div>
            </div>
            <div className="modal-action flex-wrap justify-start gap-2">
              {showAdminLink && (
                <Link
                  href={`/${locale}/admin`}
                  className="btn btn-soft btn-primary rounded-full gap-2"
                  aria-label={t('account.adminPanel')}
                  onNavigate={() => account.current?.close()}
                >
                  <LayoutDashboard
                    aria-hidden="true"
                    className="shrink-0 size-4"
                  />
                  <span className="max-[360px]:hidden">
                    {t('account.adminPanel')}
                  </span>
                  <span className="min-[361px]:hidden">
                    {t('account.adminPanelShort')}
                  </span>
                </Link>
              )}
              <GradientButton
                disabled={signingOut}
                onClick={() => {
                  account.current?.close();
                  router.push(`${accountHref}?tab=edit`);
                }}
              >
                <span className="inline-flex items-center gap-2">
                  <Pencil aria-hidden="true" className="shrink-0 size-4" />
                  {t('account.profile.editShort')}
                </span>
              </GradientButton>
              <button
                type="button"
                className="btn btn-soft btn-error rounded-full gap-2"
                disabled={signingOut}
                onClick={logout}
              >
                <LogOut
                  aria-hidden="true"
                  className="shrink-0 rtl:rotate-180 size-4"
                />
                {signingOut
                  ? t('account.loading')
                  : t(
                      showAdminLink
                        ? 'account.signOutShort'
                        : 'account.signOut',
                    )}
              </button>
            </div>
            {signOutFailed && (
              <p role="alert" className="mt-3 text-sm text-error">
                {t('account.unavailable')}
              </p>
            )}
          </div>
          <Backdrop />
        </dialog>
      )}
      <dialog ref={cart} className="modal" aria-labelledby="cart-title">
        <div className="modal-box">
          <DialogHeading id="cart-title" title={t('cart.title')} />
          <div className="empty-state [&_p]:text-base-content/65 flex items-center flex-col gap-3.5 [padding:36px_10px_20px] text-center [&_h3]:text-lg [&_h3]:font-semibold [&_p]:text-sm [&_p]:leading-[1.8]">
            <ShoppingBag
              size={42}
              strokeWidth={1.3}
              className="text-secondary"
            />
            <h3>{t('cart.emptyTitle')}</h3>
            <p>{t('cart.emptyDescription')}</p>
            <form method="dialog">
              <button className="btn btn-primary mt-2">
                {t('common.keepExploring')}
              </button>
            </form>
          </div>
        </div>
        <Backdrop />
      </dialog>
      <dialog ref={results} className="modal" aria-labelledby="results-title">
        <div className="modal-box">
          <div className="flex items-center justify-between gap-4">
            <h2
              id="results-title"
              className="min-w-0 break-words text-lg font-bold"
            >
              {result.title}
            </h2>
            <CloseButton />
          </div>
          <div className="empty-state [&_p]:text-base-content/65 flex items-center flex-col gap-3.5 [padding:36px_10px_20px] text-center [&_h3]:text-lg [&_h3]:font-semibold [&_p]:text-sm [&_p]:leading-[1.8]">
            <Search size={38} strokeWidth={1.3} className="text-secondary" />
            <p>{result.detail}</p>
          </div>
        </div>
        <Backdrop />
      </dialog>
    </>
  );
}

function CloseButton() {
  const t = useTranslations();
  return <ModalCloseButton label={t('common.closeDialog')} />;
}
function DialogHeading({ id, title }: { id: string; title: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <h2 id={id} className="text-lg font-bold">
        {title}
      </h2>
      <CloseButton />
    </div>
  );
}
function Backdrop() {
  const t = useTranslations();
  return (
    <form method="dialog" className="modal-backdrop">
      <button aria-label={t('common.closeDialog')}>{t('common.close')}</button>
    </form>
  );
}
