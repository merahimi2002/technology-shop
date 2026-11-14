import { encodeAvatar } from '@/lib/auth/encode-avatar';
import { getCurrentUser } from '@/lib/auth/session';
import { MAX_AVATAR_BASE64_LENGTH } from '@/lib/auth/avatar';
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
    const user = await getCurrentUser();
    if (!user) return profileResponse({ error: 'UNAUTHORIZED' }, 401);
    const body = await readAuthJson(request, MAX_AVATAR_BASE64_LENGTH);
    if (body instanceof Response) return body;

    const result = profileSchema.safeParse(body.input);
    if (!result.success)
      return profileResponse({ error: 'INVALID_INPUT' }, 400);
    const { name, avatar } = result.data;
    const image =
      typeof avatar === 'string' ? await encodeAvatar(avatar) : avatar;
    if (typeof avatar === 'string' && !image)
      return profileResponse({ error: 'INVALID_AVATAR' }, 400);
    const updated = await getDb().user.updateMany({
      where: { id: user.id, disabledAt: null },
      data: { name, image },
    });
    if (!updated.count)
      return profileResponse({ error: 'ACCOUNT_CHANGED' }, 409);
    return profileResponse({ ok: true }, 200);
  } catch {
    return profileResponse({ error: 'UNAVAILABLE' }, 503);
  }
}
