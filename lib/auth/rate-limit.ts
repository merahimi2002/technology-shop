import 'server-only';
import { createHmac } from 'node:crypto';
import { getDb } from '@/lib/db';

async function consume(key: string, maximum: number, seconds: number) {
  const expiresAt = new Date(Date.now() + seconds * 1000);
  const rows = await getDb().$queryRaw<{ count: number }[]>`
    INSERT INTO "AuthRateLimit" ("key", "count", "expiresAt")
    VALUES (${key}, 1, ${expiresAt})
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE WHEN "AuthRateLimit"."expiresAt" <= now() THEN 1 ELSE LEAST("AuthRateLimit"."count", ${maximum}) + 1 END,
      "expiresAt" = CASE WHEN "AuthRateLimit"."expiresAt" <= now() THEN EXCLUDED."expiresAt" ELSE "AuthRateLimit"."expiresAt" END
    RETURNING "count"
  `;
  return rows[0].count <= maximum;
}

export async function allowAuthAttempt(
  identifier: string,
  action: 'login' | 'register' | 'password' | 'recovery' | 'reset',
) {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret || secret.length < 32 || secret.startsWith('REPLACE-'))
    throw new Error('A strong NEXTAUTH_SECRET is required.');
  // The global cap also bounds work when an attacker rotates email addresses.
  if (!(await consume('auth:global', 60, 60))) return false;
  const digest = createHmac('sha256', secret).update(identifier).digest('hex');
  const allowed = await consume(
    `${action}:${digest}`,
    action === 'login' ? 10 : 3,
    900,
  );
  // Bound expired bucket storage without relying on a local process timer.
  await getDb().authRateLimit.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
  return allowed;
}
