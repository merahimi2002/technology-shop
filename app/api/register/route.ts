import { readAuthJson } from '@/lib/auth/json-request';
import { getDb } from '@/lib/db';
import { registerSchema } from '@/lib/auth/validation';
import { hashPassword } from '@/lib/auth/password';
import { allowAuthAttempt } from '@/lib/auth/rate-limit';

export async function POST(request: Request) {
  try {
    const body = await readAuthJson(request);
    if (body instanceof Response) return body;
    const result = registerSchema.safeParse(body.input);
    if (!result.success)
      return Response.json({ error: 'INVALID_INPUT' }, { status: 400 });
    const { name, email, password } = result.data;
    if (!(await allowAuthAttempt(email, 'register')))
      return Response.json(
        { error: 'RATE_LIMITED' },
        { status: 429, headers: { 'Retry-After': '900' } },
      );
    const passwordHash = await hashPassword(password);
    // Duplicate emails receive the same response and cost as new addresses.
    await getDb().user.createMany({
      data: [{ name, email, passwordHash }],
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
