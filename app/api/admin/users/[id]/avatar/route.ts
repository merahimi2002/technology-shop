import { canAccessAdmin } from '@/lib/auth/admin-access';
import { getCurrentUser } from '@/lib/auth/session';
import { getDb } from '@/lib/db';

export async function GET(
  _request: Request,
  { params }: RouteContext<'/api/admin/users/[id]/avatar'>,
) {
  const headers = { 'Cache-Control': 'private, no-store' };
  const actor = await getCurrentUser();
  if (!actor) return new Response(null, { status: 401, headers });
  if (!canAccessAdmin(actor.role))
    return new Response(null, { status: 403, headers });

  const { id } = await params;
  const user = await getDb().user.findUnique({
    where: { id },
    select: { image: true },
  });
  const prefix = 'data:image/webp;base64,';
  if (!user?.image?.startsWith(prefix))
    return new Response(null, { status: 404, headers });

  return new Response(Buffer.from(user.image.slice(prefix.length), 'base64'), {
    headers: {
      ...headers,
      'Content-Type': 'image/webp',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
