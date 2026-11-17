'use client';

import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import {
  Menu,
  LayoutDashboard,
  ChevronsLeft,
  ChevronsRight,
  ShoppingBag,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { AdminToolbar } from '@/components/admin/admin-toolbar';
import { Logo } from '@/components/logo';
import { ModalCloseButton } from '@/components/modal-close-button';
import { ParticleTerrain } from '@/components/particle-terrain';
import { cn } from '@/lib/utils';

gsap.registerPlugin(useGSAP);

const sections = [
  { path: '', labelKey: 'admin.dashboard', Icon: LayoutDashboard },
  { path: '/users', labelKey: 'admin.heading', Icon: Users },
] as const;

function SidebarContent({
  collapsed = false,
  control,
  close,
}: {
  collapsed?: boolean;
  control: ReactNode;
  close?: () => void;
}) {
  const locale = useLocale();
  const pathname = usePathname();
  const t = useTranslations();
  const itemClass = cn(
    'flex min-h-11 items-center rounded-xl font-medium',
    collapsed ? 'justify-center px-0' : 'gap-3 px-3',
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div
        className={cn(
          'flex items-center justify-between gap-2',
          collapsed && 'flex-col',
        )}
      >
        <div className="flex min-w-0 items-center gap-2 px-1">
          <Logo label={t('brand.name')} className="size-10 shrink-0" />
          {!collapsed && (
            <span className="truncate text-sm font-bold">
              {t('account.adminPanel')}
            </span>
          )}
        </div>
        {control}
      </div>
      <nav className="mt-7" aria-label={t('account.adminPanel')}>
        <ul className="menu w-full gap-2 p-0">
          {sections.map(({ path, labelKey, Icon }) => {
            const href = `/${locale}/admin${path}`;
            const active = pathname === href;
            return (
              <li
                key={path}
                className={
                  collapsed
                    ? `tooltip tooltip-primary ${locale === 'fa' ? 'tooltip-left' : 'tooltip-right'}`
                    : undefined
                }
                data-tip={collapsed ? t(labelKey) : undefined}
              >
                <Link
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  aria-label={t(labelKey)}
                  onClick={close}
                  className={cn(
                    itemClass,
                    active && 'bg-primary/12 text-primary hover:bg-primary/18',
                  )}
                >
                  <Icon size={19} className="shrink-0" aria-hidden="true" />
                  {!collapsed && t(labelKey)}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="mt-auto grid gap-3 border-t border-base-content/10 pt-3">
        <div
          className={
            collapsed
              ? `tooltip tooltip-primary ${locale === 'fa' ? 'tooltip-left' : 'tooltip-right'}`
              : undefined
          }
          data-tip={collapsed ? t('admin.backToStore') : undefined}
        >
          <Link
            href={locale === 'en' ? '/en' : '/'}
            aria-label={t('admin.backToStore')}
            onClick={close}
            className={cn(
              itemClass,
              'btn btn-ghost w-full justify-start',
              collapsed && 'justify-center',
            )}
          >
            <ShoppingBag size={18} className="shrink-0" aria-hidden="true" />
            {!collapsed && t('admin.backToStore')}
          </Link>
        </div>
      </div>
    </div>
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  const t = useTranslations();
  const locale = useLocale();
  const [collapsed, setCollapsed] = useState(false);
  const [waves, setWaves] = useState(true);
  const shellId = useId();
  const sidebarId = `${shellId}-sidebar`;
  const drawerId = `${shellId}-drawer`;
  const contentId = `${shellId}-content`;
  const dialog = useRef<HTMLDialogElement>(null);
  const drawer = useRef<HTMLDivElement>(null);
  const { contextSafe } = useGSAP();

  useEffect(() => {
    const desktop = matchMedia('(min-width: 64rem)');
    function closeOnDesktop() {
      if (desktop.matches) dialog.current?.close();
    }
    desktop.addEventListener('change', closeOnDesktop);
    return () => desktop.removeEventListener('change', closeOnDesktop);
  }, []);

  function openMenu() {
    dialog.current?.showModal();
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
      contextSafe(() =>
        gsap.fromTo(
          drawer.current,
          { x: locale === 'fa' ? 24 : -24, opacity: 0.6 },
          {
            x: 0,
            opacity: 1,
            duration: 0.24,
            ease: 'power3.out',
            overwrite: true,
            clearProps: 'transform,opacity',
          },
        ),
      )();
    }
  }
  const collapseLabel = t(
    collapsed ? 'admin.expandSidebar' : 'admin.collapseSidebar',
  );
  const PanelIcon = collapsed ? ChevronsRight : ChevronsLeft;

  return (
    <div className="relative isolate flex min-h-dvh w-full flex-1 gap-4 bg-base-200 lg:gap-5 lg:p-4">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-screen bg-radial-[at_50%_0%] from-primary/12 to-transparent to-70%"
      />
      {waves && (
        <div
          data-admin-wave-background
          className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
          aria-hidden="true"
        >
          <ParticleTerrain
            word=""
            dotScale={1.65}
            className="text-primary/80"
          />
        </div>
      )}
      <a
        href={`#${contentId}`}
        className="skip-link fixed -top-[100px] start-6 z-[100] btn btn-primary focus:top-3"
      >
        {t('common.skipToContent')}
      </a>
      <aside
        id={sidebarId}
        data-admin-sidebar
        data-locale-motion
        className={cn(
          'glass-header sticky top-4 z-20 hidden h-[calc(100dvh-2rem)] shrink-0 flex-col rounded-[24px] p-3 motion-safe:transition-[width] motion-safe:duration-240 motion-safe:ease-out lg:flex',
          collapsed ? 'w-20' : 'w-64',
        )}
      >
        <SidebarContent
          collapsed={collapsed}
          control={
            <button
              type="button"
              onClick={() => setCollapsed(!collapsed)}
              aria-label={collapseLabel}
              title={collapseLabel}
              aria-expanded={!collapsed}
              aria-controls={sidebarId}
              className="btn btn-soft btn-secondary btn-square btn-sm shrink-0"
            >
              <PanelIcon
                size={19}
                className="rtl:-scale-x-100"
                aria-hidden="true"
              />
            </button>
          }
        />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminToolbar
          waves={waves}
          onToggleWaves={() => setWaves((enabled) => !enabled)}
          menuButton={
            <button
              type="button"
              aria-label={t('admin.openSidebar')}
              aria-haspopup="dialog"
              aria-controls={drawerId}
              onClick={openMenu}
              className="btn btn-soft btn-secondary btn-square btn-sm shrink-0 rounded-xl lg:hidden"
            >
              <Menu size={21} aria-hidden="true" />
            </button>
          }
        />
        <div
          id={contentId}
          data-admin-content
          data-locale-motion
          tabIndex={-1}
          className="flex min-w-0 flex-1 flex-col"
        >
          {children}
        </div>
      </div>
      <dialog
        ref={dialog}
        id={drawerId}
        aria-label={t('account.adminPanel')}
        className="modal right-auto left-0 w-dvw items-stretch justify-items-start motion-reduce:transition-none lg:hidden"
      >
        <div
          ref={drawer}
          className="glass-header z-10 col-start-1 row-start-1 flex h-dvh w-[min(18rem,calc(100vw-3rem))] flex-col overflow-y-auto rounded-e-[24px] p-4"
        >
          <SidebarContent
            control={<ModalCloseButton label={t('common.close')} />}
            close={() => dialog.current?.close()}
          />
        </div>
        <form method="dialog" className="modal-backdrop">
          <button type="submit" aria-label={t('common.close')} tabIndex={-1} />
        </form>
      </dialog>
    </div>
  );
}
