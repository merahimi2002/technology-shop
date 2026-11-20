import { beforeEach, expect, it, vi } from 'vitest';
import { deleteUser, updateUser } from '@/app/[locale]/admin/actions';

const { getCurrentUser, findUnique, updateMany, deleteMany, refresh } =
  vi.hoisted(() => ({
    getCurrentUser: vi.fn(),
    findUnique: vi.fn(),
    updateMany: vi.fn(),
    deleteMany: vi.fn(),
    refresh: vi.fn(),
  }));
vi.mock('server-only', () => ({}));
vi.mock('@/lib/auth/session', () => ({ getCurrentUser }));
vi.mock('@/lib/db', () => ({
  getDb: () => ({ user: { findUnique, updateMany, deleteMany } }),
}));
vi.mock('next/cache', () => ({ refresh }));

const date = new Date('2026-11-17T10:00:00.000Z');
const version = date.toISOString();

function submit(
  role = 'ADMIN',
  status = 'disabled',
  id = 'target',
  timestamp = version,
) {
  const form = new FormData();
  form.set('role', role);
  form.set('status', status);
  return updateUser(id, timestamp, null, form);
}

beforeEach(() => {
  vi.clearAllMocks();
  getCurrentUser.mockResolvedValue({ id: 'owner', role: 'OWNER' });
  findUnique.mockResolvedValue({
    role: 'CUSTOMER',
    disabledAt: null,
    updatedAt: date,
  });
  updateMany.mockResolvedValue({ count: 1 });
  deleteMany.mockResolvedValue({ count: 1 });
});

it.each([null, 'CUSTOMER', 'ADMIN'])(
  'rejects direct submissions from %s',
  async (role) => {
    getCurrentUser.mockResolvedValue(role ? { id: 'actor', role } : null);
    expect(await submit()).toBe('forbidden');
    expect(findUnique).not.toHaveBeenCalled();
    expect(updateMany).not.toHaveBeenCalled();
  },
);

it('protects owner accounts and rejects an attempt to assign ownership', async () => {
  expect(await submit('ADMIN', 'disabled', 'owner')).toBe('forbidden');
  expect(await submit('OWNER')).toBe('invalid');
  findUnique.mockResolvedValue({
    role: 'OWNER',
    disabledAt: null,
    updatedAt: date,
  });
  expect(await submit()).toBe('forbidden');
  expect(updateMany).not.toHaveBeenCalled();
});

it('updates access and revokes old sessions together', async () => {
  expect(await submit()).toBe('saved');
  expect(updateMany).toHaveBeenCalledWith({
    where: { id: 'target', role: 'CUSTOMER', updatedAt: date },
    data: {
      role: 'ADMIN',
      disabledAt: expect.any(Date),
      sessionVersion: { increment: 1 },
    },
  });
  expect(refresh).toHaveBeenCalledOnce();
});

it('changes status while preserving the current role', async () => {
  findUnique.mockResolvedValue({
    role: 'ADMIN',
    disabledAt: null,
    updatedAt: date,
  });
  expect(await submit('ADMIN', 'disabled')).toBe('saved');
  expect(updateMany.mock.calls[0][0].data).toMatchObject({
    role: 'ADMIN',
    disabledAt: expect.any(Date),
    sessionVersion: { increment: 1 },
  });
});

it('changes role while preserving a disabled account', async () => {
  findUnique.mockResolvedValue({
    role: 'CUSTOMER',
    disabledAt: date,
    updatedAt: date,
  });
  expect(await submit('ADMIN', 'disabled')).toBe('saved');
  expect(updateMany.mock.calls[0][0].data).toMatchObject({
    role: 'ADMIN',
    disabledAt: date,
    sessionVersion: { increment: 1 },
  });
});

it('rejects stale forms and updates that lose a write race', async () => {
  expect(
    await submit('ADMIN', 'disabled', 'target', new Date(0).toISOString()),
  ).toBe('conflict');
  expect(updateMany).not.toHaveBeenCalled();
  updateMany.mockResolvedValue({ count: 0 });
  expect(await submit()).toBe('conflict');
  expect(refresh).not.toHaveBeenCalled();
});

function removeUser(
  id = 'target',
  timestamp = version,
  confirmation = 'delete',
) {
  const form = new FormData();
  form.set('confirmation', confirmation);
  return deleteUser(id, timestamp, null, form);
}

it.each([null, 'CUSTOMER', 'ADMIN'])(
  'rejects account deletion by %s',
  async (role) => {
    getCurrentUser.mockResolvedValue(role ? { id: 'actor', role } : null);
    expect(await removeUser()).toBe('forbidden');
    expect(deleteMany).not.toHaveBeenCalled();
  },
);

it('never deletes the owner or the acting account', async () => {
  expect(await removeUser('owner')).toBe('forbidden');
  findUnique.mockResolvedValue({ role: 'OWNER', updatedAt: date });
  expect(await removeUser()).toBe('forbidden');
  expect(deleteMany).not.toHaveBeenCalled();
});

it.each(['CUSTOMER', 'ADMIN'])(
  'deletes a confirmed %s account with its current version',
  async (role) => {
    findUnique.mockResolvedValue({ role, updatedAt: date });
    expect(await removeUser()).toBe('saved');
    expect(deleteMany).toHaveBeenCalledWith({
      where: { id: 'target', role, updatedAt: date },
    });
    expect(refresh).toHaveBeenCalledOnce();
  },
);

it('requires confirmation and valid deletion arguments', async () => {
  expect(await removeUser('target', version, '')).toBe('invalid');
  expect(await removeUser('', version)).toBe('invalid');
  expect(await removeUser('target', 'invalid')).toBe('invalid');
  expect(deleteMany).not.toHaveBeenCalled();
});

it('rejects stale deletion forms, missing accounts and races', async () => {
  expect(await removeUser('target', new Date(0).toISOString())).toBe(
    'conflict',
  );
  expect(deleteMany).not.toHaveBeenCalled();
  findUnique.mockResolvedValueOnce(null);
  expect(await removeUser()).toBe('forbidden');
  deleteMany.mockResolvedValueOnce({ count: 0 });
  expect(await removeUser()).toBe('conflict');
  expect(refresh).not.toHaveBeenCalled();
});

it('preserves order history when the database rejects deletion', async () => {
  deleteMany.mockRejectedValueOnce({ code: 'P2003' });
  expect(await removeUser()).toBe('hasOrders');
  expect(refresh).not.toHaveBeenCalled();
});

it('does not expose internal deletion errors', async () => {
  deleteMany.mockRejectedValueOnce(new Error('private database details'));
  expect(await removeUser()).toBe('unavailable');
  expect(refresh).not.toHaveBeenCalled();
});
