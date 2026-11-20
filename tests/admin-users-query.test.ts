import { beforeEach, expect, it, vi } from 'vitest';
import { listUsers, parseUserFilters } from '@/lib/admin/users';

const { count, findMany } = vi.hoisted(() => ({
  count: vi.fn(),
  findMany: vi.fn(),
}));
vi.mock('server-only', () => ({}));
vi.mock('@/lib/db', () => ({ getDb: () => ({ user: { count, findMany } }) }));

beforeEach(() => {
  vi.clearAllMocks();
  count.mockResolvedValue(50);
  findMany.mockResolvedValue([]);
});

it('only accepts known sorting fields and directions', () => {
  expect(
    parseUserFilters({ sort: 'passwordHash', direction: 'invalid' }),
  ).toMatchObject({ sort: '', direction: 'desc' });
  expect(
    parseUserFilters({ sort: ['role'], direction: ['asc'] }),
  ).toMatchObject({ sort: '', direction: 'desc' });
});

it.each(['asc', 'desc'] as const)(
  'sorts roles %s in the database before pagination',
  async (direction) => {
    await listUsers(
      parseUserFilters({
        sort: 'role',
        direction,
        page: '2',
        pageSize: '10',
        q: 'name',
        status: 'active',
      }),
      'OWNER',
    );
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [{ role: direction }, { createdAt: 'desc' }, { id: 'desc' }],
        skip: 10,
        take: 10,
        where: expect.objectContaining({ disabledAt: null }),
      }),
    );
  },
);

it.each(['asc', 'desc'] as const)(
  'groups status %s with explicit ordering of active accounts',
  async (direction) => {
    await listUsers(parseUserFilters({ sort: 'status', direction }), 'OWNER');
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [
          {
            disabledAt: {
              sort: direction,
              nulls: direction === 'asc' ? 'first' : 'last',
            },
          },
          { createdAt: 'desc' },
          { id: 'desc' },
        ],
      }),
    );
  },
);

it('keeps newest-first ordering when no sort is requested', async () => {
  await listUsers(parseUserFilters({}), 'OWNER');
  expect(findMany).toHaveBeenCalledWith(
    expect.objectContaining({
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    }),
  );
});

it('removes staff emails from data returned to an admin but keeps customer emails', async () => {
  findMany.mockResolvedValue([
    {
      id: 'customer',
      role: 'CUSTOMER',
      email: 'customer@example.com',
      image: null,
    },
    { id: 'admin', role: 'ADMIN', email: 'admin@example.com', image: null },
    { id: 'owner', role: 'OWNER', email: 'owner@example.com', image: null },
  ]);
  const result = await listUsers(parseUserFilters({}), 'ADMIN');
  expect(result.users.map((user) => user.email)).toEqual([
    'customer@example.com',
    null,
    null,
  ]);
});

it('keeps staff emails available to the owner', async () => {
  findMany.mockResolvedValue([
    { id: 'admin', role: 'ADMIN', email: 'admin@example.com', image: null },
    { id: 'owner', role: 'OWNER', email: 'owner@example.com', image: null },
  ]);
  const result = await listUsers(parseUserFilters({}), 'OWNER');
  expect(result.users.map((user) => user.email)).toEqual([
    'admin@example.com',
    'owner@example.com',
  ]);
});

it('does not match hidden staff emails through search for admins', async () => {
  await listUsers(parseUserFilters({ q: 'private' }), 'ADMIN');
  expect(findMany).toHaveBeenCalledWith(
    expect.objectContaining({
      where: {
        OR: [
          { name: { contains: 'private', mode: 'insensitive' } },
          {
            role: 'CUSTOMER',
            email: { contains: 'private', mode: 'insensitive' },
          },
        ],
      },
    }),
  );
});
