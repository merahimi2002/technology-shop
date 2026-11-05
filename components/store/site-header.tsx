'use client';

import Link from 'next/link';
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
  Laptop,
  LayoutGrid,
  Menu,
  Search,
  ShoppingBag,
  Smartphone,
  Palette,
  UserRound,
  Usb,
  X,
} from 'lucide-react';
import { Logo } from '@/components/logo';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { ThemeToggle } from '@/components/theme-toggle';
import { STORE_CATEGORIES } from '@/lib/store-navigation';

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
        aria-label="جست‌وجوی محصولات"
        placeholder="دنبال چی می‌گردی؟"
        autoComplete="off"
      />
      <kbd className="hidden text-base-content/40 lg:block" aria-hidden="true">
        /
      </kbd>
      <button
        className="search-submit min-h-9 h-9 w-9 rounded-[9px] btn btn-ghost btn-square"
        type="submit"
        aria-label="جست‌وجو"
      >
        <ArrowUpLeft size={19} />
      </button>
    </form>
  );
}

export function SiteHeader() {
  const mobileMenu = useRef<HTMLDialogElement>(null);
  const preferences = useRef<HTMLDialogElement>(null);
  const cart = useRef<HTMLDialogElement>(null);
  const account = useRef<HTMLDialogElement>(null);
  const results = useRef<HTMLDialogElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const categoryMenu = useRef<HTMLDetailsElement>(null);
  const [result, setResult] = useState({ title: 'محصولات', detail: '' });

  useEffect(() => {
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
      if (searchInput.current?.getClientRects().length) {
        event.preventDefault();
        searchInput.current.focus();
      }
    }
    document.addEventListener('keydown', shortcuts);
    return () => document.removeEventListener('keydown', shortcuts);
  }, []);

  function showResults(title: string, detail: string) {
    setResult({ title, detail });
    categoryMenu.current?.removeAttribute('open');
    mobileMenu.current?.close();
    results.current?.showModal();
  }
  const search = (query: string) =>
    showResults(
      `جست‌وجو برای «${query}»`,
      'هنوز محصولی برای نمایش وجود ندارد.',
    );
  const category = (label: string) =>
    showResults(label, 'محصولات این دسته به‌زودی اضافه می‌شوند.');

  return (
    <>
      <a
        href="#main-content"
        className="skip-link focus:top-3 fixed -top-[100px] start-6 z-[100] btn btn-primary"
      >
        رفتن به محتوای اصلی
      </a>
      <header
        className="store-header sticky top-5 z-[30] w-[calc(100%_-_64px)] [margin:24px_auto_0] [@media(max-width:1023px)]:top-3 [@media(max-width:1023px)]:w-[calc(100%_-_40px)] [@media(max-width:1023px)]:mt-4"
        aria-label="هدر فروشگاه تک‌شاپ"
      >
        <div className="glass-header rounded-[24px] [@media(max-width:1023px)]:rounded-[20px]">
          <div className="navbar header-main gap-9 min-h-[98px] px-7 py-4 [@media(max-width:1023px)]:gap-2.5 [@media(max-width:1023px)]:min-h-[82px] [@media(max-width:1023px)]:px-4 [@media(max-width:1023px)]:py-3 [@media(max-width:390px)]:px-[10px] [@media(max-width:390px)]:gap-0.5">
            <button
              className="btn btn-ghost btn-square lg:hidden"
              type="button"
              aria-label="باز کردن منوی فروشگاه"
              aria-controls="store-mobile-menu"
              onClick={() => mobileMenu.current?.showModal()}
            >
              <Menu size={23} strokeWidth={1.7} />
            </button>
            <Link
              href="/"
              className="brand-link flex items-center gap-0.5 shrink-0 no-underline [@media(max-width:1023px)]:me-auto [@media(max-width:1023px)]:[&_svg]:w-[49px] [@media(max-width:1023px)]:[&_svg]:h-[49px] [@media(max-width:390px)]:gap-0 [@media(max-width:390px)]:[&_svg]:w-[42px] [@media(max-width:390px)]:[&_svg]:h-[42px]"
              aria-label="تک‌شاپ، صفحه اصلی"
            >
              <Logo width={62} height={62} aria-hidden="true" />
              <span className="brand-type flex flex-col gap-0.5 [&_strong]:text-[26px] [&_strong]:font-bold [&_strong]:leading-[1.2] [&_strong]:tracking-[-1px] [&_strong]:whitespace-nowrap [&>_span]:text-[9px] [&>_span]:font-semibold [&>_span]:tracking-[3px] [@media(max-width:1023px)]:[&_strong]:text-[23px] [@media(max-width:1023px)]:[&>_span]:text-[7px] [@media(max-width:1023px)]:[&>_span]:tracking-[2px] [@media(max-width:390px)]:[&_strong]:text-[21px]">
                <strong>
                  تک‌شاپ<span className="brand-dot text-secondary">.</span>
                </strong>
                <span lang="en" dir="ltr">
                  TECH SHOP
                </span>
              </span>
            </Link>
            <div className="desktop-search flex-1 max-w-140 mx-auto hidden lg:block">
              <SearchForm inputRef={searchInput} onSearch={search} />
            </div>
            <div className="header-actions flex items-center gap-3 shrink-0 [@media(max-width:1023px)]:gap-1 [@media(max-width:390px)]:gap-0 [@media(max-width:639px)]:gap-0">
              <ThemeToggle />
              <button
                type="button"
                className="account-button min-h-11 h-11 px-[9px] text-[13px] font-medium btn btn-ghost hidden sm:inline-flex"
                onClick={() => account.current?.showModal()}
                aria-label="ورود یا ثبت‌نام"
              >
                <UserRound size={21} strokeWidth={1.7} />
                <span className="hidden xl:inline">
                  ورود <span className="text-base-content/30">/</span> ثبت‌نام
                </span>
              </button>
              <span
                className="action-separator bg-base-content/12 h-6 w-[1px] [@media(max-width:1023px)]:hidden"
                aria-hidden="true"
              />
              <button
                type="button"
                className="cart-button relative w-11 min-h-11 h-11 btn btn-ghost btn-square"
                aria-label="سبد خرید، بدون کالا"
                onClick={() => cart.current?.showModal()}
              >
                <ShoppingBag size={22} strokeWidth={1.7} />
              </button>
            </div>
          </div>
          <div className="mobile-search px-4 pb-4 pt-0 lg:hidden">
            <SearchForm onSearch={search} />
          </div>
          <div className="header-nav items-center justify-between gap-6 px-7 pb-2.5 pt-0 hidden lg:flex">
            <nav
              aria-label="ناوبری اصلی"
              className="nav-links flex items-center gap-7 min-w-0"
            >
              <details
                ref={categoryMenu}
                className="dropdown category-dropdown"
                onBlur={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget))
                    event.currentTarget.open = false;
                }}
              >
                <summary className="btn btn-ghost category-trigger border-0 bg-transparent shadow-none [&::marker]:hidden [&::-webkit-details-marker]:hidden [&>svg:last-child]:ms-1 h-[38px] min-h-[38px] p-0 gap-[9px] text-[13px] font-semibold text-secondary">
                  <LayoutGrid size={18} />
                  <span>دسته‌بندی محصولات</span>
                  <ChevronDown size={15} />
                </summary>
                <ul
                  className="dropdown-content menu category-menu border border-base-300 [&_button>svg:first-child]:text-secondary min-w-70 mt-[17px] p-2.5 rounded-[16px] bg-base-100 [&_button]:min-h-12 [&_button]:gap-3.5 [&_button]:text-[13px]"
                  aria-label="دسته‌بندی محصولات"
                >
                  {STORE_CATEGORIES.map((item) => {
                    const Icon = icons[item.icon];
                    return (
                      <li key={item.slug}>
                        <button
                          type="button"
                          aria-label={item.label}
                          onClick={() => category(item.label)}
                        >
                          <Icon size={19} />
                          <span>{item.label}</span>
                          <ArrowUpLeft
                            size={15}
                            className="ms-auto text-base-content/35"
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
                  showResults(
                    'همه محصولات',
                    'هنوز محصولی برای نمایش وجود ندارد.',
                  )
                }
              >
                همه محصولات
              </button>
              <button
                className="nav-link hover:text-secondary flex items-center gap-[7px] min-h-[38px] text-[13px] whitespace-nowrap cursor-pointer"
                type="button"
                onClick={() =>
                  showResults(
                    'تازه‌رسیده‌ها',
                    'محصولات جدید به‌زودی اینجا قرار می‌گیرند.',
                  )
                }
              >
                تازه‌رسیده‌ها
              </button>
              <button
                className="nav-link hover:text-secondary flex items-center gap-[7px] min-h-[38px] text-[13px] whitespace-nowrap cursor-pointer"
                type="button"
                onClick={() =>
                  showResults(
                    'پیشنهادهای ویژه',
                    'در حال حاضر پیشنهاد فعالی وجود ندارد.',
                  )
                }
              >
                پیشنهادهای ویژه
                <span
                  className="offer-dot h-[5px] w-[5px] rounded-full bg-secondary"
                  aria-hidden="true"
                />
              </button>
            </nav>
            <button
              className="appearance-button text-base-content/66 px-[10px] gap-2 text-xs font-normal btn btn-ghost btn-sm"
              type="button"
              onClick={() => preferences.current?.showModal()}
              aria-label="انتخاب تم دلخواه"
            >
              <Palette size={16} />
              <span>انتخاب تم دلخواه</span>
            </button>
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
              تک‌شاپ<span className="text-secondary">.</span>
            </h2>
            <form method="dialog">
              <button
                className="btn btn-ghost btn-square"
                aria-label="بستن منو"
              >
                <X size={21} />
              </button>
            </form>
          </div>
          <p className="mt-7 mb-3 text-sm text-base-content/55">
            دسته‌بندی محصولات
          </p>
          <ul className="menu w-full gap-2 p-0">
            {STORE_CATEGORIES.map((item) => {
              const Icon = icons[item.icon];
              return (
                <li key={item.slug}>
                  <button
                    aria-label={item.label}
                    onClick={() => category(item.label)}
                    className="min-h-12"
                  >
                    <Icon size={21} className="text-secondary" />
                    {item.label}
                    <ArrowUpLeft size={16} className="ms-auto opacity-40" />
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="divider my-6" />
          <button
            className="btn btn-ghost w-full justify-start sm:hidden"
            type="button"
            onClick={() => {
              mobileMenu.current?.close();
              account.current?.showModal();
            }}
          >
            <UserRound size={19} strokeWidth={1.7} />
            ورود / ثبت‌نام
          </button>
          <button
            className="btn btn-ghost w-full justify-start"
            onClick={() => {
              mobileMenu.current?.close();
              preferences.current?.showModal();
            }}
          >
            <Palette size={19} />
            انتخاب تم دلخواه
          </button>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button aria-label="بستن منوی فروشگاه">بستن</button>
        </form>
      </dialog>

      <dialog
        ref={preferences}
        className="modal"
        aria-labelledby="appearance-title"
      >
        <div className="modal-box">
          <DialogHeading id="appearance-title" title="انتخاب تم دلخواه" />
          <ThemeSwitcher />
        </div>
        <Backdrop />
      </dialog>
      <dialog ref={cart} className="modal" aria-labelledby="cart-title">
        <div className="modal-box">
          <DialogHeading id="cart-title" title="سبد خرید" />
          <div className="empty-state [&_p]:text-base-content/65 flex items-center flex-col gap-3.5 [padding:36px_10px_20px] text-center [&_h3]:text-lg [&_h3]:font-semibold [&_p]:text-sm [&_p]:leading-[1.8]">
            <ShoppingBag
              size={42}
              strokeWidth={1.3}
              className="text-secondary"
            />
            <h3>سبد خریدت هنوز خالیه</h3>
            <p>محصول‌های انتخابی‌ات اینجا قرار می‌گیرند.</p>
            <form method="dialog">
              <button className="btn btn-primary mt-2">ادامه گشت‌وگذار</button>
            </form>
          </div>
        </div>
        <Backdrop />
      </dialog>
      <dialog ref={account} className="modal" aria-labelledby="account-title">
        <div className="modal-box">
          <DialogHeading id="account-title" title="حساب کاربری" />
          <div className="empty-state [&_p]:text-base-content/65 flex items-center flex-col gap-3.5 [padding:36px_10px_20px] text-center [&_h3]:text-lg [&_h3]:font-semibold [&_p]:text-sm [&_p]:leading-[1.8]">
            <UserRound size={42} strokeWidth={1.3} className="text-secondary" />
            <h3>به تک‌شاپ خوش اومدی</h3>
            <p>ورود و ثبت‌نام به‌زودی در دسترس قرار می‌گیره.</p>
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
  return (
    <form method="dialog">
      <button
        className="btn btn-ghost btn-square shrink-0"
        aria-label="بستن پنجره"
      >
        <X size={21} />
      </button>
    </form>
  );
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
  return (
    <form method="dialog" className="modal-backdrop">
      <button aria-label="بستن پنجره">بستن</button>
    </form>
  );
}
