import { getDb } from '@/lib/db';
import { registerSchema } from '@/lib/auth/validation';
import { hashPassword } from '@/lib/auth/password';
import { allowAuthAttempt } from '@/lib/auth/rate-limit';

export async function POST(request: Request) {
  const origin = process.env.NEXTAUTH_URL;
  if (!origin || request.headers.get('origin') !== new URL(origin).origin) {
    return Response.json({ error: 'FORBIDDEN' }, { status: 403 });
  }
  if (!request.headers.get('content-type')?.startsWith('application/json')) {
    return Response.json({ error: 'INVALID_INPUT' }, { status: 415 });
  }
  try {
    const reader = request.body?.getReader();
    if (!reader)
      return Response.json({ error: 'INVALID_INPUT' }, { status: 400 });
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > 8192) {
        await reader.cancel();
        return Response.json({ error: 'INVALID_INPUT' }, { status: 413 });
      }
      chunks.push(value);
    }
    let input: unknown;
    try {
      input = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    } catch {
      return Response.json({ error: 'INVALID_INPUT' }, { status: 400 });
    }
    const result = registerSchema.safeParse(input);
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
