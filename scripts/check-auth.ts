import { loadEnvConfig } from '@next/env';
import { createHmac, randomBytes, randomUUID } from 'node:crypto';
import assert from 'node:assert/strict';

loadEnvConfig(process.cwd());

async function main() {
  const base = process.env.AUTH_TEST_URL ?? 'http://localhost:3100';
  const origin = new URL(base).origin;
  if (!['localhost', '127.0.0.1'].includes(new URL(base).hostname)) {
    throw new Error('The auth check requires a local application server.');
  }
  const email = `auth-check-${randomUUID()}@example.invalid`;
  const password = randomBytes(4).toString('hex'); // Exactly eight characters.
  const jar = new Map<string, string>();
  const { getDb } = await import('../lib/db');
  const db = getDb();
  let userId: string | undefined;
  const passed: string[] = [];

  async function call(path: string, init: RequestInit = {}) {
    const headers = new Headers(init.headers);
    if (jar.size)
      headers.set(
        'cookie',
        [...jar].map(([key, value]) => `${key}=${value}`).join('; '),
      );
    const response = await fetch(`${origin}${path}`, {
      ...init,
      headers,
      redirect: 'manual',
    });
    for (const cookie of response.headers.getSetCookie()) {
      const [pair] = cookie.split(';');
      const separator = pair.indexOf('=');
      const key = pair.slice(0, separator);
      const value = pair.slice(separator + 1);
      if (value) jar.set(key, value);
      else jar.delete(key);
    }
    return response;
  }
  function register(input: Record<string, unknown>, requestOrigin = origin) {
    return call('/api/register', {
      method: 'POST',
      headers: { origin: requestOrigin, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Auth integration check',
        email,
        password,
        ...input,
      }),
    });
  }
  async function csrf() {
    const response = await call('/api/auth/csrf');
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.ok(body.csrfToken);
    return body.csrfToken as string;
  }
  async function login(attempt: string) {
    return call('/api/auth/callback/credentials', {
      method: 'POST',
      headers: { origin, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        csrfToken: await csrf(),
        email,
        password: attempt,
        callbackUrl: origin,
        json: 'true',
      }),
    });
  }
  async function logout() {
    const response = await call('/api/auth/signout', {
      method: 'POST',
      headers: { origin, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        csrfToken: await csrf(),
        callbackUrl: origin,
        json: 'true',
      }),
    });
    assert.equal(response.status, 200);
  }

  try {
    assert.equal((await call('/api/account')).status, 401);
    assert.equal((await register({}, 'https://other.example')).status, 403);
    assert.equal((await register({ password: '1234567' })).status, 400);
    passed.push(
      'unauthenticated access, origin and seven-character password rejected',
    );

    const registered = await register({ role: 'OWNER', sessionVersion: 999 });
    assert.equal(registered.status, 200);
    const user = await db.user.findUniqueOrThrow({ where: { email } });
    userId = user.id;
    assert.equal(user.role, 'CUSTOMER');
    assert.equal(user.sessionVersion, 0);
    assert.ok(user.passwordHash && !user.passwordHash.includes(password));
    const { verifyPassword } = await import('../lib/auth/password');
    assert.equal(await verifyPassword(password, user.passwordHash), true);
    passed.push(
      'eight-character registration, hashed storage and privilege escalation prevention',
    );

    const duplicate = await register({
      password: 'different-password',
      role: 'ADMIN',
    });
    assert.equal(duplicate.status, 200);
    assert.deepEqual(await duplicate.json(), await registered.json());
    const unchanged = await db.user.findUniqueOrThrow({ where: { email } });
    assert.equal(unchanged.passwordHash, user.passwordHash);
    assert.equal(unchanged.role, 'CUSTOMER');
    passed.push('duplicate email does not overwrite password or role');

    const wrong = await login('incorrect-password');
    assert.equal(wrong.status, 401);
    assert.equal((await call('/api/account')).status, 401);
    const valid = await login(password);
    assert.equal(valid.status, 200);
    const sessionResponse = await call('/api/auth/session');
    const session = await sessionResponse.json();
    assert.equal(session.user.id, userId);
    assert.equal(session.user.role, 'CUSTOMER');
    assert.ok(!JSON.stringify(session).includes(user.passwordHash!));
    assert.equal((await call('/api/account')).status, 200);
    passed.push(
      'wrong password rejected, valid credentials persist a safe session',
    );

    await logout();
    assert.equal((await call('/api/account')).status, 401);
    assert.ok(!(await (await call('/api/auth/session')).json()).user);
    passed.push('sign-out clears the browser session and protected access');

    assert.equal((await login(password)).status, 200);
    await db.user.update({
      where: { id: userId },
      data: { sessionVersion: { increment: 1 } },
    });
    assert.equal((await call('/api/account')).status, 401);
    await logout();
    passed.push('sessionVersion invalidates an existing session');

    const limitKey = `login:${createHmac('sha256', process.env.NEXTAUTH_SECRET!).update(email).digest('hex')}`;
    await db.authRateLimit.upsert({
      where: { key: limitKey },
      create: {
        key: limitKey,
        count: 10,
        expiresAt: new Date(Date.now() + 900000),
      },
      update: { count: 10, expiresAt: new Date(Date.now() + 900000) },
    });
    assert.equal((await login(password)).status, 401);
    passed.push('database-backed login throttle rejects excessive attempts');
    for (const result of passed) console.info(`PASS: ${result}`);
  } finally {
    // Delete only this run's generated CUSTOMER. Never touch real or privileged users.
    if (userId)
      await db.user.deleteMany({
        where: { id: userId, email, role: 'CUSTOMER' },
      });
    const digest = createHmac('sha256', process.env.NEXTAUTH_SECRET!)
      .update(email)
      .digest('hex');
    await db.authRateLimit.deleteMany({
      where: { key: { in: [`login:${digest}`, `register:${digest}`] } },
    });
    await db.$disconnect();
  }
}

main().catch(() => {
  console.error(
    'Auth integration check failed. No credentials or raw error details were printed.',
  );
  process.exitCode = 1;
});
