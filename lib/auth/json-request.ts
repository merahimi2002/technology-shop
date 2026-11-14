import 'server-only';

export async function readAuthJson(request: Request) {
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
  return { input };
}
