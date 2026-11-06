import { afterEach, beforeEach, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
const mocks = vi.hoisted(() => ({
  createMany: vi.fn(),
  hash: vi.fn(),
  allow: vi.fn(),
}));
vi.mock('@/lib/db', () => ({
  getDb: () => ({ user: { createMany: mocks.createMany } }),
}));
vi.mock('@/lib/auth/password', () => ({ hashPassword: mocks.hash }));
vi.mock('@/lib/auth/rate-limit', () => ({ allowAuthAttempt: mocks.allow }));
import { POST } from '../app/api/register/route';

const payload = {
  name: 'Test',
  email: 'USER@example.com',
  password: 'test password long enough',
  role: 'ADMIN',
};
function request(body: unknown = payload, origin = 'http://localhost:3000') {
  return new Request('http://localhost:3000/api/register', {
    method: 'POST',
    headers: { origin, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}
beforeEach(() => {
  vi.stubEnv('NEXTAUTH_URL', 'http://localhost:3000');
  vi.clearAllMocks();
  mocks.allow.mockResolvedValue(true);
  mocks.hash.mockResolvedValue('salted hash');
  mocks.createMany.mockResolvedValue({ count: 1 });
});
afterEach(() => vi.unstubAllEnvs());

it('rejects cross-origin, invalid, and oversized input before database writes', async () => {
  expect((await POST(request(payload, 'https://other.example'))).status).toBe(
    403,
  );
  expect((await POST(request({ ...payload, password: 'weak' }))).status).toBe(
    400,
  );
  expect(
    (await POST(request({ ...payload, name: 'a'.repeat(9000) }))).status,
  ).toBe(413);
  expect(mocks.createMany).not.toHaveBeenCalled();
  expect(mocks.hash).not.toHaveBeenCalled();
});
it.each(['ADMIN', 'OWNER'])(
  'ignores attempted %s privilege escalation during registration',
  async (role) => {
    expect(
      (await POST(request({ ...payload, role, sessionVersion: 999 }))).status,
    ).toBe(200);
    expect(mocks.createMany).toHaveBeenCalledWith({
      data: [
        {
          name: 'Test',
          email: 'user@example.com',
          passwordHash: 'salted hash',
        },
      ],
      skipDuplicates: true,
    });
  },
);
it('returns the same response for existing and new accounts', async () => {
  const first = await POST(request());
  mocks.createMany.mockResolvedValue({ count: 0 });
  const second = await POST(request());
  expect(second.status).toBe(first.status);
  expect(await second.json()).toEqual(await first.json());
});
it('throttles before password work and masks infrastructure errors', async () => {
  mocks.allow.mockResolvedValueOnce(false);
  const limited = await POST(request());
  expect(limited.status).toBe(429);
  expect(limited.headers.get('Retry-After')).toBe('900');
  expect(mocks.hash).not.toHaveBeenCalled();
  mocks.createMany.mockRejectedValueOnce(new Error('sensitive driver details'));
  const failed = await POST(request());
  expect(failed.status).toBe(503);
  expect(await failed.text()).not.toContain('sensitive');
});
