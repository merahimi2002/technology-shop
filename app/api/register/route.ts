import { readAuthJson } from '@/lib/auth/json-request';
import { getDb } from '@/lib/db';
import { registerRequestSchema } from '@/lib/auth/validation';
import { MAX_AVATAR_BASE64_LENGTH } from '@/lib/auth/avatar';
import { encodeAvatar } from '@/lib/auth/encode-avatar';
import { hashPassword } from '@/lib/auth/password';
import { allowAuthAttempt } from '@/lib/auth/rate-limit';

export async function POST(request: Request) {
  try {
    const body = await readAuthJson(request, MAX_AVATAR_BASE64_LENGTH);
    if (body instanceof Response) return body;
    const result = registerRequestSchema.safeParse(body.input);
    if (!result.success)
      return Response.json({ error: 'INVALID_INPUT' }, { status: 400 });
    const { name, email, password, avatar } = result.data;
    if (!(await allowAuthAttempt(email, 'register')))
      return Response.json(
        { error: 'RATE_LIMITED' },
        { status: 429, headers: { 'Retry-After': '900' } },
      );
    const image = avatar === undefined ? undefined : await encodeAvatar(avatar);
    if (avatar !== undefined && !image)
      return Response.json({ error: 'INVALID_AVATAR' }, { status: 400 });
    const passwordHash = await hashPassword(password);
    // Duplicate emails receive the same response and cost as new addresses.
    await getDb().user.createMany({
      data: [{ name, email, passwordHash, image }],
      skipDuplicates: true,
    });
    return Response.json(
      { ok: true },
      { status: 200, headers: { 'Cache-Control': 'no-store' } },
    );
  } catch {
    return Response.json({ error: 'UNAVAILABLE' }, { status: 503 });
  }
}
