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
    <form role="search" onSubmit={submit} className="header-search input">
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
        className="search-submit btn btn-ghost btn-square"
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
      <a href="#main-content" className="skip-link btn btn-primary">
        رفتن به محتوای اصلی
      </a>
      <header className="store-header" aria-label="هدر فروشگاه تک‌شاپ">
        <div className="glass-header">
          <div className="navbar header-main">
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
              className="brand-link"
              aria-label="تک‌شاپ، صفحه اصلی"
            >
              <Logo width={62} height={62} aria-hidden="true" />
              <span className="brand-type">
                <strong>
                  تک‌شاپ<span className="brand-dot">.</span>
                </strong>
                <span lang="en" dir="ltr">
                  TECH SHOP
                </span>
              </span>
            </Link>
            <div className="desktop-search hidden lg:block">
              <SearchForm inputRef={searchInput} onSearch={search} />
            </div>
            <div className="header-actions">
              <ThemeToggle />
              <button
                type="button"
                className="account-button btn btn-ghost hidden sm:inline-flex"
                onClick={() => account.current?.showModal()}
                aria-label="ورود یا ثبت‌نام"
              >
                <UserRound size={21} strokeWidth={1.7} />
                <span className="hidden xl:inline">
                  ورود <span className="text-base-content/30">/</span> ثبت‌نام
                </span>
              </button>
              <span className="action-separator" aria-hidden="true" />
              <button
                type="button"
                className="cart-button btn btn-ghost btn-square"
                aria-label="سبد خرید، بدون کالا"
                onClick={() => cart.current?.showModal()}
              >
                <ShoppingBag size={22} strokeWidth={1.7} />
              </button>
            </div>
          </div>
          <div className="mobile-search lg:hidden">
            <SearchForm onSearch={search} />
          </div>
          <div className="header-nav hidden lg:flex">
            <nav aria-label="ناوبری اصلی" className="nav-links">
              <details
                ref={categoryMenu}
                className="dropdown category-dropdown"
                onBlur={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget))
                    event.currentTarget.open = false;
                }}
              >
                <summary className="btn btn-ghost category-trigger">
                  <LayoutGrid size={18} />
                  <span>دسته‌بندی محصولات</span>
                  <ChevronDown size={15} />
                </summary>
                <ul
                  className="dropdown-content menu category-menu"
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
              <span className="nav-divider" aria-hidden="true" />
              <button
                className="nav-link"
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
                className="nav-link"
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
                className="nav-link"
                type="button"
                onClick={() =>
                  showResults(
                    'پیشنهادهای ویژه',
                    'در حال حاضر پیشنهاد فعالی وجود ندارد.',
                  )
                }
              >
                پیشنهادهای ویژه
                <span className="offer-dot" aria-hidden="true" />
              </button>
            </nav>
            <button
              className="appearance-button btn btn-ghost btn-sm"
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
        <div className="modal-box mobile-sheet">
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
          <div className="empty-state">
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
          <div className="empty-state">
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
          <div className="empty-state">
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
