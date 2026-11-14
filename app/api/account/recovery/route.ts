import { after } from 'next/server';
import { createHash, randomBytes } from 'node:crypto';
import { getTranslations } from 'next-intl/server';
import { readAuthJson } from '@/lib/auth/json-request';
import { hashPassword } from '@/lib/auth/password';
import { allowAuthAttempt } from '@/lib/auth/rate-limit';
import {
  recoveryRequestSchema,
  resetPasswordSchema,
} from '@/lib/auth/validation';
import { getDb } from '@/lib/db';

const prefix = 'password-reset:';
const lifetime = 30 * 60 * 1000;
const digest = (token: string) =>
  createHash('sha256').update(token).digest('hex');

function reply(error?: string, status = 200) {
  return Response.json(error ? { error } : { ok: true }, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  });
}

export async function POST(request: Request) {
  try {
    const body = await readAuthJson(request);
    if (body instanceof Response) return body;
    const parsed = recoveryRequestSchema.safeParse(body.input);
    if (!parsed.success) return reply('INVALID_INPUT', 400);
    const { email, locale } = parsed.data;
    const {
      RESEND_API_KEY: key,
      RECOVERY_EMAIL_FROM: from,
      NEXTAUTH_URL: origin,
    } = process.env;
    if (!key || !from || !origin) return reply('UNAVAILABLE', 503);
    if (!(await allowAuthAttempt(email, 'recovery'))) return reply();

    // A uniform response prevents email delivery timing from revealing accounts.
    after(async () => {
      try {
        const db = getDb();
        await db.verificationToken.deleteMany({
          where: {
            identifier: { startsWith: prefix },
            expires: { lte: new Date() },
          },
        });
        const user = await db.user.findUnique({
          where: {
            email,
            disabledAt: null,
            role: { not: 'OWNER' },
            passwordHash: { not: null },
          },
          select: { id: true, sessionVersion: true },
        });
        if (!user) return;
        const token = randomBytes(32).toString('base64url');
        const stored = digest(token);
        await db.verificationToken.create({
          data: {
            identifier: `${prefix}${user.id}:${user.sessionVersion}`,
            token: stored,
            expires: new Date(Date.now() + lifetime),
          },
        });

        try {
          const link = new URL(`/${locale}/account/reset-password`, origin);
          link.hash = token;
          const t = await getTranslations({
            locale,
            namespace: 'account.recovery',
          });
          const sent = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${key}`,
              'Content-Type': 'application/json',
            },
            signal: AbortSignal.timeout(10_000),
            body: JSON.stringify({
              from,
              to: [email],
              subject: t('emailSubject'),
              text: t('emailBody', { link: link.href }),
            }),
          });
          if (!sent.ok) throw new Error('Delivery rejected');
        } catch {
          await db.verificationToken.deleteMany({ where: { token: stored } });
          console.error('[auth] PASSWORD_RESET_DELIVERY_FAILED');
        }
      } catch {
        console.error('[auth] PASSWORD_RESET_REQUEST_FAILED');
      }
    });
    return reply();
  } catch {
    return reply('UNAVAILABLE', 503);
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await readAuthJson(request);
    if (body instanceof Response) return body;
    const parsed = resetPasswordSchema.safeParse(body.input);
    if (!parsed.success) return reply('INVALID_INPUT', 400);
    const token = digest(parsed.data.token);
    const db = getDb();
    const record = await db.verificationToken.findUnique({ where: { token } });
    if (!record?.identifier.startsWith(prefix) || record.expires <= new Date())
      return reply('INVALID_LINK', 400);
    const [, id, version] = record.identifier.split(':');
    if (!(await allowAuthAttempt(id, 'reset')))
      return reply('RATE_LIMITED', 429);
    const passwordHash = await hashPassword(parsed.data.password);

    const updated = await db.$transaction(async (tx) => {
      const consumed = await tx.verificationToken.deleteMany({
        where: {
          token,
          identifier: record.identifier,
          expires: { gt: new Date() },
        },
      });
      if (!consumed.count) return false;
      const result = await tx.user.updateMany({
        where: {
          id,
          sessionVersion: Number(version),
          disabledAt: null,
          role: { not: 'OWNER' },
          passwordHash: { not: null },
        },
        data: { passwordHash, sessionVersion: { increment: 1 } },
      });
      return result.count === 1;
    });
    return updated ? reply() : reply('INVALID_LINK', 400);
  } catch {
    return reply('UNAVAILABLE', 503);
  }
}
