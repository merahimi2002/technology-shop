import { getCurrentUser } from '@/lib/auth/session';
import { canAccessAdmin } from '@/lib/auth/admin-access';
import { getDb } from '@/lib/db';
import { downloadCategoryImage } from '@/lib/category-image';

export async function GET(
  _request: Request,
  { params }: RouteContext<'/api/admin/categories/[id]/image'>,
) {
  const headers = {
    'Cache-Control': 'private, no-store',
    'X-Content-Type-Options': 'nosniff',
  };
  const actor = await getCurrentUser();
  if (!actor) return new Response(null, { status: 401, headers });
  if (!canAccessAdmin(actor.role))
    return new Response(null, { status: 403, headers });
  const { id } = await params;
  try {
    const category = await getDb().category.findUnique({
      where: { id },
      select: { imagePath: true },
    });
    if (!category?.imagePath)
      return new Response(null, { status: 404, headers });
    const image = await downloadCategoryImage(category.imagePath);
    if (!image) return new Response(null, { status: 404, headers });
    return new Response(image, {
      headers: { ...headers, 'Content-Type': 'image/webp' },
    });
  } catch {
    return new Response(null, { status: 503, headers });
  }
}
