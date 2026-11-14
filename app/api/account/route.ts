import { getCurrentUser } from '@/lib/auth/session';
import { readAuthJson } from '@/lib/auth/json-request';
import { profileSchema } from '@/lib/auth/validation';
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
    headers: { 'Cache-Control': 'no-store' },
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
    const updated = await getDb().user.updateMany({
      where: { id: user.id, disabledAt: null },
      data: result.data,
    });
    if (!updated.count)
      return profileResponse({ error: 'ACCOUNT_CHANGED' }, 409);
    return profileResponse({ ok: true }, 200);
  } catch {
    return profileResponse({ error: 'UNAVAILABLE' }, 503);
  }
}
