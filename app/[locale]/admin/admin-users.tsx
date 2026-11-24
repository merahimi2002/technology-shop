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
  ShieldCheck,
  Pencil,
  Users,
} from 'lucide-react';
import { AccountRoleBadge } from '@/components/store/account-role-badge';
import { AccountAvatar } from '@/components/store/account-avatar';
import { FormError } from '@/components/ui/form-error';
import {
  TableViewport,
  Table,
  TableHeader,
  TableBody,
} from '@/components/ui/table';
import { Pagination } from '@/components/pagination';
import { useSkeletonPreview } from '@/components/dev-skeleton-preview';
import type { UserFilters, UserList } from '@/lib/admin/users';
import { deleteUser, updateUser } from './actions';

gsap.registerPlugin(useGSAP);

type User = UserList['users'][number];
const roles = ['CUSTOMER', 'ADMIN', 'OWNER'] as const;

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
              <FormError className="mt-3">
                {t(`results.${result}`)}
              </FormError>
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
  loading = false,
}: {
  filters: UserFilters;
  result: UserList;
  canEdit: boolean;
  currentUserId: string;
  loading?: boolean;
}) {
  const preview = useSkeletonPreview();
  const showSkeleton = loading || preview;
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations('admin');
  const account = useTranslations('account');
  const format = useFormatter();
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
    viewport.style.removeProperty('--admin-results-height');
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
      viewport.style.setProperty(
        '--admin-results-height',
        `${reservedHeight}px`,
      );
    });
    resize.observe(content);
    return () => {
      resize.disconnect();
      viewport.style.removeProperty('--admin-results-height');
    };
  }, [listKey]);

  useGSAP(
    () => {
      if (showSkeleton) return;
      const media = gsap.matchMedia();
      results.current?.parentElement?.scrollTo({ top: 0 });
      media.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.fromTo(
          results.current,
          { opacity: 0.3 },
          {
            opacity: 1,
            duration: 0.24,
            ease: 'power3.out',
            clearProps: 'opacity',
          },
        );
      });
      return () => media.revert();
    },
    { dependencies: [filterKey, showSkeleton], revertOnUpdate: true },
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
    <div
      className="motion-reduce:[&_.skeleton]:animate-none"
      aria-busy={showSkeleton}
    >
      {showSkeleton && (
        <span role="status" className="sr-only">
          {t('loading')}
        </span>
      )}
      <div
        inert={showSkeleton}
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
            <input type="hidden" name="direction" value={filters.direction} />
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
            <input type="hidden" name="direction" value={filters.direction} />
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

      <TableViewport className="mx-3 mt-4 mb-3 sm:mx-5 sm:mb-5">
        <div ref={results} data-admin-results className="min-w-0">
          {result.users.length > 0 || loading ? (
            <>
              <Table
                className="max-md:min-w-[48rem]"
                role="table"
                aria-label={t('heading')}
              >
                <TableHeader inert={showSkeleton} role="rowgroup">
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
                </TableHeader>
                <TableBody role="rowgroup">
                  {showSkeleton ? (
                    <UserSkeletonRows
                      pageSize={filters.pageSize}
                      users={result.users}
                      canEdit={canEdit}
                    />
                  ) : (
                    result.users.map((user) => (
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
                                    <ShieldCheck size={18} aria-hidden="true" />
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
                                  key={user.updatedAt.toISOString() + '-status'}
                                  user={user}
                                  field="status"
                                />
                                <UserChangeButton
                                  key={user.updatedAt.toISOString() + '-delete'}
                                  user={user}
                                  field="delete"
                                />
                              </div>
                            )}
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </TableBody>
              </Table>
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
      </TableViewport>
      <div
        inert={showSkeleton}
        className="border-t border-base-content/10 px-6 py-4 sm:px-8"
      >
        <Pagination
          total={result.total}
          page={result.page}
          pageCount={result.pages}
          pageSize={filters.pageSize}
          pathname={pathname}
          query={paginationQuery.toString()}
        />
      </div>
    </div>
  );
}

function UserSkeletonRows({
  users,
  canEdit,
  pageSize,
}: {
  users: User[];
  canEdit: boolean;
  pageSize: number;
}) {
  const rows: (User | null)[] = users.length
    ? users
    : Array.from({ length: Math.min(5, pageSize) }, () => null);
  return rows.map((user, index) => (
    <tr
      key={user?.id ?? index}
      aria-hidden="true"
      className="align-top even:bg-base-100/10"
    >
      <th
        scope="row"
        className="font-normal max-md:z-10 md:static md:bg-transparent"
      >
        <div className="flex min-w-0 items-center gap-3">
          <span className="skeleton size-10 shrink-0 rounded-full ring-1 ring-base-content/10 ring-offset-2 ring-offset-base-100/20" />
          <div className="min-w-0 flex-1 max-md:group-data-[compact=true]/table:sr-only">
            <div className="relative min-h-5 font-semibold max-md:truncate md:wrap-anywhere">
              <span className="invisible">{user?.name}</span>
              <span className="skeleton absolute start-0 top-1 h-3 w-3/5" />
            </div>
            {(!user || user.email) && (
              <div
                className="relative min-h-5 text-sm max-md:truncate md:wrap-anywhere"
                dir="ltr"
              >
                <span className="invisible">{user?.email}</span>
                <span className="skeleton absolute inset-x-0 top-1 h-3" />
              </div>
            )}
          </div>
        </div>
      </th>
      <td>
        <span className="badge skeleton w-14 border-0" />
      </td>
      <td>
        <span className="badge skeleton w-14 border-0" />
      </td>
      <td className="text-sm text-base-content/75">
        <span className="skeleton inline-block h-4 w-20 max-w-full" />
      </td>
      {canEdit && (
        <td>
          <div className="flex flex-wrap justify-start gap-2">
            {Array.from(
              { length: user?.role === 'OWNER' ? 2 : 3 },
              (_, action) => (
                <span
                  key={action}
                  className="skeleton size-8 shrink-0 rounded-field"
                />
              ),
            )}
          </div>
        </td>
      )}
    </tr>
  ));
}
