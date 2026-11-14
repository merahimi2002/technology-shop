import { getCurrentUser } from '@/lib/auth/session';
import { getDb } from '@/lib/db';

export async function GET() {
  const headers = { 'Cache-Control': 'private, no-store' };
  const user = await getCurrentUser();
  if (!user) return new Response(null, { status: 401, headers });

  const record = await getDb().user.findUnique({
    where: { id: user.id, disabledAt: null },
    select: { image: true },
  });
  const prefix = 'data:image/webp;base64,';
  if (!record?.image?.startsWith(prefix))
    return new Response(null, { status: 404, headers });

  return new Response(
    Buffer.from(record.image.slice(prefix.length), 'base64'),
    {
      headers: {
        ...headers,
        'Content-Type': 'image/webp',
        'X-Content-Type-Options': 'nosniff',
      },
    },
  );
}
