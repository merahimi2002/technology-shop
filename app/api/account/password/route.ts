import { readAuthJson } from '@/lib/auth/json-request';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import { allowAuthAttempt } from '@/lib/auth/rate-limit';
import { getCurrentUser } from '@/lib/auth/session';
import { changePasswordSchema } from '@/lib/auth/validation';
import { getDb } from '@/lib/db';

function failure(error: string, status: number) {
  return Response.json(
    { error },
    { status, headers: { 'Cache-Control': 'no-store' } },
  );
}

export async function PATCH(request: Request) {
  try {
    const body = await readAuthJson(request);
    if (body instanceof Response) return body;
    const user = await getCurrentUser();
    if (!user) return failure('UNAUTHORIZED', 401);
    if (user.role === 'OWNER') return failure('FORBIDDEN', 403);

    const result = changePasswordSchema.safeParse(body.input);
    if (!result.success) return failure('INVALID_INPUT', 400);
    if (!(await allowAuthAttempt(user.id, 'password')))
      return failure('RATE_LIMITED', 429);

    const db = getDb();
    const current = await db.user.findUnique({
      where: { id: user.id, disabledAt: null, role: { not: 'OWNER' } },
      select: { passwordHash: true, sessionVersion: true },
    });
    if (!current) return failure('ACCOUNT_CHANGED', 409);
    if (
      !(await verifyPassword(result.data.currentPassword, current.passwordHash))
    )
      return failure('WRONG_PASSWORD', 422);

    const passwordHash = await hashPassword(result.data.newPassword);
    const updated = await db.user.updateMany({
      where: {
        id: user.id,
        disabledAt: null,
        role: { not: 'OWNER' },
        sessionVersion: current.sessionVersion,
        passwordHash: current.passwordHash,
      },
      data: { passwordHash, sessionVersion: { increment: 1 } },
    });
    if (!updated.count) return failure('ACCOUNT_CHANGED', 409);
    return new Response(null, {
      status: 204,
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch {
    return failure('UNAVAILABLE', 503);
  }
}
