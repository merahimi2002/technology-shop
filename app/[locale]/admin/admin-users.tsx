'use client';

import {
  useActionState,
  useId,
  useLayoutEffect,
  useRef,
  useEffect,
} from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import Form from 'next/form';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useFormatter, useTranslations } from 'next-intl';
import {
  CalendarDays,
  KeyRound,
  UserRoundKey,
  UserRound,
  Slash,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Trash2,
  UserRoundCheck,
  UserRoundX,
  CircleCheck,
  LayoutDashboard,
  ShieldCheck,
  Pencil,
  Users,
} from 'lucide-react';
import { AccountRoleBadge } from '@/components/store/account-role-badge';
import { AccountAvatar } from '@/components/store/account-avatar';
import { Pagination } from '@/components/pagination';
import { Title } from '@/components/title';
import { Subtitle } from '@/components/subtitle';
import type { UserFilters, UserList } from '@/lib/admin/users';
import { deleteUser, updateUser } from './actions';

gsap.registerPlugin(useGSAP);

type User = UserList['users'][number];
const roles = ['CUSTOMER', 'ADMIN', 'OWNER'] as const;
const layoutClass = 'w-full min-w-0 flex-1 px-4 py-4 sm:px-6 lg:p-0';

export function AdminUsersLoading() {
  const t = useTranslations('admin');
  return (
    <main className={layoutClass}>
      <span role="status" className="sr-only">
        {t('loading')}
      </span>
      <div
        aria-hidden="true"
        className="grid gap-5 motion-reduce:[&>*]:animate-none"
      >
        <div className="skeleton h-72 rounded-box" />
      </div>
    </main>
  );
}

function UserRoundOff({ size }: { size: number }) {
  return (
    <span className="relative inline-flex" aria-hidden="true">
      <UserRound size={size} />
      <Slash size={size} className="absolute inset-0" />
    </span>
  );
}

function UserChangeButton({
  user,
  field,
}: {
  user: User;
  field: 'status' | 'role' | 'delete';
}) {
  const t = useTranslations('admin');
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [result, action, pending] = useActionState(
    (field === 'delete' ? deleteUser : updateUser).bind(
      null,
      user.id,
      user.updatedAt.toISOString(),
    ),
    null,
  );
  const status = user.disabledAt ? 'disabled' : 'active';
  const nextStatus = status === 'active' ? 'disabled' : 'active';
  const nextRole = user.role === 'ADMIN' ? 'CUSTOMER' : 'ADMIN';
  const label =
    field === 'delete'
      ? t('deleteUser')
      : field === 'status'
        ? t(user.disabledAt ? 'activateUser' : 'disableUser')
        : t(user.role === 'ADMIN' ? 'makeCustomer' : 'makeAdmin');
  const color =
    field === 'delete'
      ? 'btn-error'
      : field === 'status'
        ? user.disabledAt
          ? 'btn-success'
          : 'btn-error'
        : user.role === 'ADMIN'
          ? 'btn-error'
          : 'btn-success';
  const Icon =
    field === 'delete'
      ? Trash2
      : field === 'status'
        ? user.disabledAt
          ? UserRoundCheck
          : UserRoundX
        : user.role === 'ADMIN'
          ? UserRoundOff
          : UserRoundKey;
  const tooltipColor =
    color === 'btn-success' ? 'tooltip-success' : 'tooltip-error';

  useEffect(() => {
    if (result === 'saved') dialog.current?.close();
  }, [result]);

  return (
    <>
      <span
        className={`tooltip tooltip-top ${tooltipColor} focus-within:tooltip-open`}
        data-tip={label}
      >
        <button
          type="button"
          className={`btn btn-square btn-sm btn-soft ${color}`}
          aria-label={label}
          aria-haspopup="dialog"
          onClick={() => dialog.current?.showModal()}
        >
          <Icon size={18} aria-hidden="true" />
        </button>
      </span>
      <dialog
        ref={dialog}
        className="modal"
        aria-labelledby={titleId}
        onCancel={(event) => {
          if (pending) event.preventDefault();
        }}
      >
        <div className="modal-box glass-header rounded-3xl text-start">
          <div className="flex items-center gap-3">
            <span
              className={`grid size-10 shrink-0 place-items-center rounded-xl ${color === 'btn-success' ? 'bg-success/12 text-success' : 'bg-error/12 text-error'}`}
              aria-hidden="true"
            >
              <Icon size={22} />
            </span>
            <h2 id={titleId} className="text-lg font-bold">
              {label}
            </h2>
          </div>
          <p className="mt-3 text-sm leading-7">
            {t(field === 'delete' ? 'confirmUserDelete' : 'confirmUserChange', {
              name: user.name || user.email || t('unnamed'),
              action: label,
            })}
          </p>
          <p className="mt-2 text-xs leading-6 text-base-content/70">
            {t(field === 'delete' ? 'deleteDescription' : 'ownerDescription')}
          </p>
          <form action={action}>
            {field === 'delete' && (
              <input type="hidden" name="confirmation" value="delete" />
            )}
            <input
              type="hidden"
              name="role"
              value={field === 'role' ? nextRole : user.role}
            />
            <input
              type="hidden"
              name="status"
              value={field === 'status' ? nextStatus : status}
            />
            {result && result !== 'saved' && (
              <p role="alert" className="mt-3 text-sm text-error">
                {t(`results.${result}`)}
              </p>
            )}
            <div className="modal-action justify-end">
              <button
                type="button"
                className="btn btn-soft btn-neutral"
                disabled={pending}
                autoFocus
                onClick={() => dialog.current?.close()}
              >
                {t('cancelChange')}
              </button>
              <button
                type="submit"
                className={`btn ${color}`}
                disabled={pending}
              >
                {t(pending ? 'saving' : 'confirmChange')}
              </button>
            </div>
          </form>
        </div>
      </dialog>
    </>
  );
}
export function AdminUsers({
  filters,
  result,
  canEdit,
  currentUserId,
}: {
  filters: UserFilters;
  result: UserList;
  canEdit: boolean;
  currentUserId: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations('admin');
  const account = useTranslations('account');
  const format = useFormatter();
  const panel = useRef<HTMLDivElement>(null);
  const results = useRef<HTMLDivElement>(null);
  const filterKey = JSON.stringify(filters);
  const listKey = JSON.stringify([
    pathname,
    filters.q,
    filters.role,
    filters.status,
    filters.pageSize,
    filters.sort,
    filters.direction,
  ]);

  useLayoutEffect(() => {
    const content = results.current;
    const viewport = content?.parentElement;
    if (!content || !viewport) return;
    let width = 0;
    let reservedHeight = 0;
    viewport.style.minHeight = '';
    const resize = new ResizeObserver(() => {
      const nextWidth = content.offsetWidth;
      if (nextWidth !== width) {
        width = nextWidth;
        reservedHeight = 0;
      }
      const limit = Number.parseFloat(getComputedStyle(viewport).maxHeight);
      reservedHeight = Math.min(
        limit,
        Math.max(reservedHeight, content.offsetHeight),
      );
      viewport.style.minHeight = `${reservedHeight}px`;
    });
    resize.observe(content);
    return () => {
      resize.disconnect();
      viewport.style.minHeight = '';
    };
  }, [listKey]);

  useGSAP(
    () => {
      const media = gsap.matchMedia();
      media.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.fromTo(
          '[data-admin-enter]',
          { opacity: 0.55, y: 10 },
          {
            opacity: 1,
            y: 0,
            duration: 0.24,
            stagger: 0.04,
            ease: 'power3.out',
            clearProps: 'transform,opacity',
          },
        );
      });
      return () => media.revert();
    },
    { scope: panel },
  );

  useGSAP(
    () => {
      const media = gsap.matchMedia();
      results.current?.parentElement?.scrollTo({ top: 0 });
      media.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.fromTo(
          results.current,
          { opacity: 0.3, y: 10 },
          {
            opacity: 1,
            y: 0,
            duration: 0.24,
            ease: 'power3.out',
            clearProps: 'transform,opacity',
          },
        );
      });
      return () => media.revert();
    },
    { dependencies: [filterKey], revertOnUpdate: true },
  );

  function clearFilter(field: 'role' | 'status') {
    const query = new URLSearchParams();
    query.set('pageSize', String(filters.pageSize));
    if (filters.sort) {
      query.set('sort', filters.sort);
      query.set('direction', filters.direction);
    }
    if (filters.q) query.set('q', filters.q);
    if (field !== 'role' && filters.role) query.set('role', filters.role);
    if (field !== 'status' && filters.status)
      query.set('status', filters.status);
    router.push(query.size ? pathname + '?' + query : pathname, {
      scroll: false,
    });
  }

  const paginationQuery = new URLSearchParams();
  paginationQuery.set('pageSize', String(filters.pageSize));
  if (filters.q) paginationQuery.set('q', filters.q);
  if (filters.role) paginationQuery.set('role', filters.role);
  if (filters.status) paginationQuery.set('status', filters.status);
  if (filters.sort) {
    paginationQuery.set('sort', filters.sort);
    paginationQuery.set('direction', filters.direction);
  }

  function renderSortButton(field: 'role' | 'status') {
    const active = filters.sort === field;
    const nextDirection =
      active && filters.direction === 'desc' ? 'asc' : 'desc';
    const query = new URLSearchParams(paginationQuery);
    query.set('sort', field);
    query.set('direction', nextDirection);
    const SortIcon = active
      ? filters.direction === 'asc'
        ? ArrowUp
        : ArrowDown
      : ArrowUpDown;
    return (
      <Link
        href={`${pathname}?${query}`}
        scroll={false}
        className={`btn btn-ghost btn-square btn-xs shrink-0 ${active ? 'text-primary' : ''}`}
        aria-label={t(
          nextDirection === 'asc' ? 'sortAscending' : 'sortDescending',
          { column: t(field) },
        )}
        title={t(nextDirection === 'asc' ? 'sortAscending' : 'sortDescending', {
          column: t(field),
        })}
      >
        <SortIcon size={15} aria-hidden="true" />
      </Link>
    );
  }

  return (
    <main className={layoutClass}>
      <div ref={panel} className="grid gap-4">
        <section
          aria-label={t('heading')}
          className="glass-header min-w-0 overflow-hidden rounded-[20px]"
        >
          <div
            data-locale-motion
            className="border-b border-base-content/10 px-4 pt-5 pb-5 sm:px-5"
          >
            <Subtitle icon={<LayoutDashboard />} className="mb-1">
              {t('pageSubtitle')}
            </Subtitle>
            <Title as="h1">{t('pageTitle')}</Title>
          </div>
          <div
            data-admin-enter
            className="flex flex-wrap items-end gap-x-5 gap-y-3 px-4 pt-4 pb-0 sm:px-5"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className="shrink-0 text-base font-bold text-base-content">
                {t('role')}
              </span>
              <Form
                key={filterKey + '-role'}
                action={pathname}
                scroll={false}
                aria-label={t('role')}
                className="filter gap-y-1"
                onChange={(event) => event.currentTarget.requestSubmit()}
                onReset={(event) => {
                  event.preventDefault();
                  clearFilter('role');
                }}
              >
                <input type="hidden" name="q" value={filters.q} />
                <input type="hidden" name="pageSize" value={filters.pageSize} />
                <input type="hidden" name="status" value={filters.status} />
                <input type="hidden" name="sort" value={filters.sort} />
                <input
                  type="hidden"
                  name="direction"
                  value={filters.direction}
                />
                <input
                  className="btn btn-square btn-sm btn-soft btn-error"
                  type="reset"
                  value="×"
                  aria-label={t('allRoles')}
                />
                {roles.map((role) => (
                  <input
                    key={role}
                    className="btn btn-sm btn-soft btn-primary"
                    type="radio"
                    name="role"
                    value={role}
                    aria-label={account(`roles.${role}`)}
                    defaultChecked={filters.role === role}
                  />
                ))}
              </Form>
            </div>
            <div
              className="divider divider-horizontal divider-secondary mx-0 my-0 hidden self-stretch sm:flex"
              aria-hidden="true"
            />
            <div className="flex min-w-0 items-center gap-3">
              <span className="shrink-0 text-base font-bold text-base-content">
                {t('status')}
              </span>
              <Form
                key={filterKey + '-status'}
                action={pathname}
                scroll={false}
                aria-label={t('status')}
                className="filter gap-y-1"
                onChange={(event) => event.currentTarget.requestSubmit()}
                onReset={(event) => {
                  event.preventDefault();
                  clearFilter('status');
                }}
              >
                <input type="hidden" name="q" value={filters.q} />
                <input type="hidden" name="pageSize" value={filters.pageSize} />
                <input type="hidden" name="role" value={filters.role} />
                <input type="hidden" name="sort" value={filters.sort} />
                <input
                  type="hidden"
                  name="direction"
                  value={filters.direction}
                />
                <input
                  className="btn btn-square btn-sm btn-soft btn-error"
                  type="reset"
                  value="×"
                  aria-label={t('allStatuses')}
                />
                <input
                  className="btn btn-sm btn-soft btn-primary"
                  type="radio"
                  name="status"
                  value="active"
                  aria-label={t('active')}
                  defaultChecked={filters.status === 'active'}
                />
                <input
                  className="btn btn-sm btn-soft btn-primary"
                  type="radio"
                  name="status"
                  value="disabled"
                  aria-label={t('disabled')}
                  defaultChecked={filters.status === 'disabled'}
                />
              </Form>
            </div>
            {(filters.q || filters.role || filters.status) && (
              <>
                <div
                  className="divider divider-horizontal divider-secondary mx-0 my-0 hidden self-stretch sm:flex"
                  aria-hidden="true"
                />
                <Link
                  className="btn btn-sm btn-soft btn-error"
                  href={`${pathname}?pageSize=${filters.pageSize}${filters.sort ? `&sort=${filters.sort}&direction=${filters.direction}` : ''}`}
                  scroll={false}
                >
                  {t('clear')}
                </Link>
              </>
            )}
          </div>

          <div
            data-admin-table-viewport
            onScroll={(event) => {
              const viewport = event.currentTarget;
              viewport.dataset.compact = String(
                Math.abs(viewport.scrollLeft) > 12,
              );
            }}
            className="group/table mx-3 mt-4 mb-3 max-h-[70dvh] min-w-0 overflow-auto overscroll-contain rounded-2xl border border-base-content/8 sm:mx-5 sm:mb-5"
          >
            <div ref={results} data-admin-results className="min-w-0">
              {result.users.length > 0 ? (
                <>
                  <table
                    className="table table-pin-cols table-fixed max-md:min-w-[48rem] [&_tbody_:is(th,td)]:border-base-content/8 [&_tbody_:is(th,td)]:py-5"
                    role="table"
                    aria-label={t('heading')}
                  >
                    <thead
                      className="bg-linear-to-r from-primary/16 to-secondary/16 text-base-content rtl:bg-linear-to-l [&_th]:static [&_th]:bg-transparent [&_th]:py-4 [&_th]:text-start [&_th]:text-sm [&_th]:font-bold [&_svg]:text-primary max-md:[&_th:first-child]:sticky max-md:[&_th:first-child]:z-20 max-md:[&_th:first-child]:bg-base-200"
                      role="rowgroup"
                    >
                      <tr role="row" className="border-b border-primary/15">
                        <th
                          scope="col"
                          className="w-44 max-md:group-data-[compact=true]/table:w-18 md:w-[34%]"
                        >
                          <span className="flex items-center gap-2 max-md:group-data-[compact=true]/table:justify-center">
                            <Users
                              size={16}
                              className="shrink-0 text-current"
                              aria-hidden="true"
                            />
                            <span className="max-md:group-data-[compact=true]/table:sr-only">
                              {t('user')}
                            </span>
                          </span>
                        </th>
                        <th
                          scope="col"
                          aria-sort={
                            filters.sort === 'role'
                              ? filters.direction === 'asc'
                                ? 'ascending'
                                : 'descending'
                              : 'none'
                          }
                        >
                          <span className="flex items-center gap-2">
                            <ShieldCheck
                              size={16}
                              className="shrink-0 text-current"
                              aria-hidden="true"
                            />
                            {t('role')}
                            {renderSortButton('role')}
                          </span>
                        </th>
                        <th
                          scope="col"
                          aria-sort={
                            filters.sort === 'status'
                              ? filters.direction === 'asc'
                                ? 'ascending'
                                : 'descending'
                              : 'none'
                          }
                        >
                          <span className="flex items-center gap-2">
                            <CircleCheck
                              size={16}
                              className="shrink-0 text-current"
                              aria-hidden="true"
                            />
                            {t('status')}
                            {renderSortButton('status')}
                          </span>
                        </th>
                        <th scope="col">
                          <span className="flex items-center gap-2">
                            <CalendarDays
                              size={16}
                              className="shrink-0 text-current"
                              aria-hidden="true"
                            />
                            {t('joined')}
                          </span>
                        </th>
                        {canEdit && (
                          <th scope="col" className="w-44 md:w-[23%]">
                            <span className="flex items-center gap-2">
                              <Pencil
                                size={16}
                                className="shrink-0 text-current"
                                aria-hidden="true"
                              />
                              {t('manage')}
                            </span>
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody role="rowgroup">
                      {result.users.map((user) => (
                        <tr
                          key={user.id}
                          role="row"
                          className={`align-top motion-safe:transition-colors motion-safe:duration-150 ${user.id === currentUserId ? 'bg-primary/12 hover:bg-primary/18' : 'even:bg-base-100/10 hover:bg-primary/5'}`}
                        >
                          <th
                            scope="row"
                            role="rowheader"
                            className={`font-normal max-md:z-10 md:static md:bg-transparent ${user.id === currentUserId ? 'max-md:bg-linear-to-r max-md:from-primary/12 max-md:to-primary/12' : ''}`}
                          >
                            <div className="flex min-w-0 items-center gap-3">
                              <span className="avatar size-10 shrink-0 rounded-full ring-1 ring-base-content/10 ring-offset-2 ring-offset-base-100/20">
                                <AccountAvatar
                                  key={user.image}
                                  name={user.name}
                                  image={user.image}
                                  size={40}
                                />
                              </span>
                              <div className="min-w-0 max-md:group-data-[compact=true]/table:sr-only">
                                <div
                                  className="font-semibold max-md:truncate md:wrap-anywhere"
                                  dir="auto"
                                >
                                  {user.name || t('unnamed')}
                                </div>
                                {user.email && (
                                  <bdi
                                    className="block text-sm text-base-content/75 max-md:truncate md:wrap-anywhere"
                                    dir="ltr"
                                    title={user.email}
                                  >
                                    {user.email}
                                  </bdi>
                                )}
                              </div>
                            </div>
                          </th>
                          <td role="cell">
                            <AccountRoleBadge
                              role={user.role}
                              showLabel={false}
                            />
                          </td>
                          <td role="cell">
                            <span
                              className={
                                user.disabledAt
                                  ? 'badge badge-soft badge-error'
                                  : 'badge badge-soft badge-success'
                              }
                            >
                              {t(user.disabledAt ? 'disabled' : 'active')}
                            </span>
                          </td>
                          <td
                            role="cell"
                            className="text-sm text-base-content/75"
                          >
                            <time
                              dir="ltr"
                              className="inline-block tabular-nums"
                              dateTime={user.createdAt.toISOString()}
                            >
                              {format.dateTime(user.createdAt, {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                                timeZone: 'Asia/Tehran',
                              })}
                            </time>
                          </td>
                          {canEdit && (
                            <td role="cell">
                              {user.role === 'OWNER' ? (
                                <span
                                  className="tooltip tooltip-primary tooltip-top me-auto block w-fit"
                                  data-tip={t('protected')}
                                >
                                  <span
                                    role="img"
                                    aria-label={t('protected')}
                                    className="flex items-center justify-center gap-2 text-primary"
                                  >
                                    <span className="grid size-8 place-items-center">
                                      <KeyRound size={18} aria-hidden="true" />
                                    </span>
                                    <span className="grid size-8 place-items-center">
                                      <ShieldCheck
                                        size={18}
                                        aria-hidden="true"
                                      />
                                    </span>
                                  </span>
                                </span>
                              ) : (
                                <div className="flex flex-wrap justify-start gap-2">
                                  <UserChangeButton
                                    key={user.updatedAt.toISOString() + '-role'}
                                    user={user}
                                    field="role"
                                  />
                                  <UserChangeButton
                                    key={
                                      user.updatedAt.toISOString() + '-status'
                                    }
                                    user={user}
                                    field="status"
                                  />
                                  <UserChangeButton
                                    key={
                                      user.updatedAt.toISOString() + '-delete'
                                    }
                                    user={user}
                                    field="delete"
                                  />
                                </div>
                              )}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              ) : (
                <div className="grid justify-items-center gap-4 px-4 py-12 text-center text-base-content/75">
                  <span
                    aria-hidden="true"
                    className="grid size-12 place-items-center rounded-box bg-primary/10 text-primary"
                  >
                    <Users size={24} />
                  </span>
                  <p>{t('empty')}</p>
                </div>
              )}
            </div>
          </div>
          <div className="border-t border-base-content/10 px-6 py-4 sm:px-8">
            <Pagination
              page={result.page}
              pageCount={result.pages}
              pageSize={filters.pageSize}
              pathname={pathname}
              query={paginationQuery.toString()}
            />
          </div>
        </section>
      </div>
    </main>
  );
}
