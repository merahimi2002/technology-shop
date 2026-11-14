import 'server-only';

const MAX_AUTH_JSON_BYTES = 8192;

export async function readAuthJson(request: Request, avatarAllowance = 0) {
  const origin = process.env.NEXTAUTH_URL;
  if (!origin || request.headers.get('origin') !== new URL(origin).origin) {
    return Response.json({ error: 'FORBIDDEN' }, { status: 403 });
  }
  if (!request.headers.get('content-type')?.startsWith('application/json')) {
    return Response.json({ error: 'INVALID_INPUT' }, { status: 415 });
  }
  const reader = request.body?.getReader();
  if (!reader)
    return Response.json({ error: 'INVALID_INPUT' }, { status: 400 });
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > MAX_AUTH_JSON_BYTES + avatarAllowance) {
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
  const avatarLength =
    avatarAllowance &&
    input &&
    typeof input === 'object' &&
    'avatar' in input &&
    typeof input.avatar === 'string'
      ? Math.min(avatarAllowance, input.avatar.length)
      : 0;
  if (size - avatarLength > MAX_AUTH_JSON_BYTES)
    return Response.json({ error: 'INVALID_INPUT' }, { status: 413 });
  return { input };
}
