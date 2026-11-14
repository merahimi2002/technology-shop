import { getCurrentUser } from '@/lib/auth/session';
import { readAuthJson } from '@/lib/auth/json-request';
import { profileSchema } from '@/lib/auth/validation';
import { allowAuthAttempt } from '@/lib/auth/rate-limit';
import { verifyPassword } from '@/lib/auth/password';
import { Prisma } from '@/generated/prisma/client';
import { getDb } from '@/lib/db';

export async function GET() {
  const user = await getCurrentUser();
  return Response.json(user ? { user } : { error: 'UNAUTHORIZED' }, {
    status: user ? 200 : 401,
    headers: { 'Cache-Control': 'no-store' },
  });
}

function profileResponse(
  body: { ok: true } | { error: string },
  status: number,
) {
  return Response.json(body, {
    status,
    headers: {
      'Cache-Control': 'no-store',
      ...(status === 429 && { 'Retry-After': '900' }),
    },
  });
}

export async function PATCH(request: Request) {
  try {
    const body = await readAuthJson(request);
    if (body instanceof Response) return body;
    const user = await getCurrentUser();
    if (!user) return profileResponse({ error: 'UNAUTHORIZED' }, 401);

    const result = profileSchema.safeParse(body.input);
    if (!result.success)
      return profileResponse({ error: 'INVALID_INPUT' }, 400);
    const { name, email, currentPassword } = result.data;
    const db = getDb();
    const current = await db.user.findUnique({
      where: { id: user.id, disabledAt: null },
      select: {
        email: true,
        role: true,
        passwordHash: true,
        sessionVersion: true,
      },
    });
    if (!current) return profileResponse({ error: 'UNAUTHORIZED' }, 401);

    const changingEmail = email !== undefined && email !== current.email;
    if (changingEmail) {
      if (current.role === 'OWNER')
        return profileResponse({ error: 'FORBIDDEN' }, 403);
      if (!currentPassword)
        return profileResponse({ error: 'PASSWORD_REQUIRED' }, 400);
      if (!(await allowAuthAttempt(user.id, 'profile')))
        return profileResponse({ error: 'RATE_LIMITED' }, 429);
      if (!(await verifyPassword(currentPassword, current.passwordHash)))
        return profileResponse({ error: 'WRONG_PASSWORD' }, 422);
    }

    const updated = await db.user.updateMany({
      where: {
        id: user.id,
        disabledAt: null,
        sessionVersion: current.sessionVersion,
        email: current.email,
        ...(changingEmail && {
          role: { not: 'OWNER' },
          passwordHash: current.passwordHash,
        }),
      },
      data: { name, ...(changingEmail && { email, emailVerified: null }) },
    });
    if (!updated.count)
      return profileResponse({ error: 'ACCOUNT_CHANGED' }, 409);
    return profileResponse({ ok: true }, 200);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    )
      return profileResponse({ error: 'EMAIL_IN_USE' }, 409);
    return profileResponse({ error: 'UNAVAILABLE' }, 503);
  }
}
