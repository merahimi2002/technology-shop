import { getCurrentUser } from '@/lib/auth/session';

export async function GET() {
  const user = await getCurrentUser();
  return Response.json(user ? { user } : { error: 'UNAUTHORIZED' }, {
    status: user ? 200 : 401,
    headers: { 'Cache-Control': 'no-store' },
  });
}
