import 'server-only';
import type { Prisma } from '@/generated/prisma/client';
import type { UserRole } from '@/generated/prisma/enums';
import { getDb } from '@/lib/db';
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from '@/lib/pagination';

const userFields = {
  id: true,
  name: true,
  email: true,
  image: true,
  role: true,
  disabledAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

export function parseUserFilters(
  params: Record<string, string | string[] | undefined>,
) {
  const { q, role, status, page, pageSize, sort, direction } = params;
  const size =
    PAGE_SIZE_OPTIONS.find((value) => String(value) === pageSize) ??
    DEFAULT_PAGE_SIZE;
  const pageNumber =
    typeof page === 'string' && /^\d{1,7}$/.test(page) ? Number(page) : 1;

  return {
    q: typeof q === 'string' ? q.trim().slice(0, 120) : '',
    role:
      role === 'CUSTOMER' || role === 'ADMIN' || role === 'OWNER' ? role : '',
    status: status === 'active' || status === 'disabled' ? status : '',
    page: Math.max(1, pageNumber),
    pageSize: size,
    sort: sort === 'role' || sort === 'status' ? sort : '',
    direction: direction === 'asc' ? 'asc' : 'desc',
  } as const;
}

export type UserFilters = ReturnType<typeof parseUserFilters>;

// Only called after the admin page has checked the current database-backed session.
export async function listUsers(filters: UserFilters, viewerRole: UserRole) {
  const db = getDb();
  const canSeeStaffEmails = viewerRole === 'OWNER';
  const contains = filters.q.replace(/[\\%_]/g, '\\$&');
  const where: Prisma.UserWhereInput = {
    ...(filters.role && { role: filters.role }),
    ...(filters.status && {
      disabledAt: filters.status === 'active' ? null : { not: null },
    }),
    ...(contains && {
      OR: [
        { name: { contains, mode: 'insensitive' } },
        {
          ...(!canSeeStaffEmails && { role: 'CUSTOMER' }),
          email: { contains, mode: 'insensitive' },
        },
      ],
    }),
  };
  const total = await db.user.count({ where });
  const pages = Math.max(1, Math.ceil(total / filters.pageSize));
  const page = Math.min(filters.page, pages);
  const users = await db.user.findMany({
    where,
    select: userFields,
    orderBy: [
      ...(filters.sort === 'role' ? [{ role: filters.direction }] : []),
      ...(filters.sort === 'status'
        ? [
            {
              disabledAt: {
                sort: filters.direction,
                nulls:
                  filters.direction === 'asc'
                    ? ('first' as const)
                    : ('last' as const),
              },
            },
          ]
        : []),
      { createdAt: 'desc' },
      { id: 'desc' },
    ],
    skip: (page - 1) * filters.pageSize,
    take: filters.pageSize,
  });
  return {
    users: users.map((user) => ({
      ...user,
      email: canSeeStaffEmails || user.role === 'CUSTOMER' ? user.email : null,
      image: user.image?.startsWith('data:image/webp;base64,')
        ? `/api/admin/users/${encodeURIComponent(user.id)}/avatar?v=${user.updatedAt.getTime()}`
        : user.image,
    })),
    total,
    pages,
    page,
  };
}

export type UserList = Awaited<ReturnType<typeof listUsers>>;
