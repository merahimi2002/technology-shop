import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { JWT } from 'next-auth/jwt';
import type { CredentialsConfig } from 'next-auth/providers/credentials';
vi.mock('server-only', () => ({}));
const mocks = vi.hoisted(() => ({
  findUnique: vi.fn(),
  verify: vi.fn(),
  allow: vi.fn(),
}));
vi.mock('@/lib/db', () => ({
  getDb: () => ({ user: { findUnique: mocks.findUnique } }),
}));
vi.mock('@/lib/auth/password', () => ({ verifyPassword: mocks.verify }));
vi.mock('@/lib/auth/rate-limit', () => ({ allowAuthAttempt: mocks.allow }));
import { getAuthOptions } from '../lib/auth/options';
beforeEach(() => {
  vi.stubEnv(
    'NEXTAUTH_SECRET',
    'test-only-secret-that-is-at-least-32-characters',
  );
  vi.clearAllMocks();
  mocks.allow.mockResolvedValue(true);
});
afterEach(() => vi.unstubAllEnvs());
function authorize() {
  // NextAuth v4 merges provider options with its default configuration.
  const provider = getAuthOptions().providers[0] as unknown as {
    options: Pick<CredentialsConfig, 'authorize'>;
  };
  return provider.options.authorize;
}

it('rejects wrong passwords and disabled users and spends password work for missing users', async () => {
  const credentials = { email: 'test@example.com', password: 'test password' };
  const request = { headers: {}, query: {}, body: {}, method: 'POST' };
  mocks.findUnique.mockResolvedValueOnce(null);
  mocks.verify.mockResolvedValueOnce(false);
  expect(await authorize()(credentials, request)).toBeNull();
  expect(mocks.verify).toHaveBeenCalledWith(credentials.password, null);
  mocks.findUnique.mockResolvedValueOnce({
    id: 'user-1',
    passwordHash: 'hash',
    disabledAt: new Date(),
  });
  mocks.verify.mockResolvedValueOnce(true);
  expect(await authorize()(credentials, request)).toBeNull();
  mocks.findUnique.mockResolvedValueOnce({
    id: 'user-1',
    passwordHash: 'hash',
    disabledAt: null,
  });
  mocks.verify.mockResolvedValueOnce(false);
  expect(await authorize()(credentials, request)).toBeNull();
});
it('returns an authenticated identity without its stored hash', async () => {
  mocks.findUnique.mockResolvedValueOnce({
    id: 'user-1',
    name: 'Test',
    email: 'test@example.com',
    passwordHash: 'hash',
    sessionVersion: 0,
  });
  mocks.verify.mockResolvedValueOnce(true);
  const user = await authorize()(
    { email: 'TEST@example.com', password: 'test password' },
    { headers: {}, query: {}, body: {}, method: 'POST' },
  );
  expect(user?.id).toBe('user-1');
  expect(user).not.toHaveProperty('passwordHash');
  expect(mocks.findUnique).toHaveBeenCalledWith({
    where: { email: 'test@example.com' },
  });
});
it('throttles login before database lookup and password work', async () => {
  mocks.allow.mockResolvedValueOnce(false);
  expect(
    await authorize()(
      { email: 'test@example.com', password: 'test password' },
      { headers: {}, query: {}, body: {}, method: 'POST' },
    ),
  ).toBeNull();
  expect(mocks.findUnique).not.toHaveBeenCalled();
  expect(mocks.verify).not.toHaveBeenCalled();
});

it('does not expose database errors through NextAuth redirects', async () => {
  mocks.allow.mockRejectedValueOnce(
    new Error('sensitive database connection details'),
  );
  await expect(
    authorize()(
      { email: 'test@example.com', password: 'test password' },
      { headers: {}, query: {}, body: {}, method: 'POST' },
    ),
  ).rejects.toThrow(/^UNAVAILABLE$/);
});
async function refresh(token: JWT) {
  const callback = getAuthOptions().callbacks!.jwt!;
  return callback({
    token,
    account: null,
    user: undefined,
    profile: undefined,
  } as unknown as Parameters<typeof callback>[0]);
}
it('revokes JWT access for deleted, disabled, and version-invalidated users', async () => {
  const token = { sub: 'user-1', sessionVersion: 0, role: 'ADMIN' as const };
  mocks.findUnique.mockResolvedValueOnce(null);
  expect(await refresh(token)).toEqual({});
  mocks.findUnique.mockResolvedValueOnce({
    id: 'user-1',
    disabledAt: new Date(),
    sessionVersion: 0,
  });
  expect(await refresh(token)).toEqual({});
  mocks.findUnique.mockResolvedValueOnce({
    id: 'user-1',
    disabledAt: null,
    sessionVersion: 1,
  });
  expect(await refresh(token)).toEqual({});
});
it.each(['ADMIN', 'OWNER'] as const)(
  'refreshes roles from the database rather than trusting an old %s JWT role',
  async (oldRole) => {
    mocks.findUnique.mockResolvedValueOnce({
      id: 'user-1',
      name: 'Test',
      email: 'test@example.com',
      image: null,
      role: 'CUSTOMER',
      sessionVersion: 0,
    });
    const token = await refresh({
      sub: 'user-1',
      role: oldRole,
      sessionVersion: 0,
    });
    expect(token.role).toBe('CUSTOMER');
  },
);
it('does not expose a revoked token as a session user', async () => {
  const callback = getAuthOptions().callbacks!.session!;
  const session = await callback({
    session: {
      expires: new Date().toISOString(),
      user: { id: 'old-user', role: 'ADMIN' },
    },
    token: {},
  } as unknown as Parameters<typeof callback>[0]);
  expect(session.user).toBeUndefined();
});
