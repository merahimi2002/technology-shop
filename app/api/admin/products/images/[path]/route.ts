import { getCurrentUser } from '@/lib/auth/session';
import { canAccessAdmin } from '@/lib/auth/admin-access';
import { getDb } from '@/lib/db';
import {
  downloadCategoryImage,
  isCategoryImagePath,
  productImageBucket,
} from '@/lib/category-image';

const headers = {
  'Cache-Control': 'private, no-store',
  'X-Content-Type-Options': 'nosniff',
};

export async function GET(
  _request: Request,
  { params }: RouteContext<'/api/admin/products/images/[path]'>,
) {
  const actor = await getCurrentUser();
  if (!actor) return new Response(null, { status: 401, headers });
  if (!canAccessAdmin(actor.role))
    return new Response(null, { status: 403, headers });
  const { path } = await params;
  if (!isCategoryImagePath(path))
    return new Response(null, { status: 404, headers });
  try {
    const record = await getDb().productImage.findUnique({
      where: { path },
      select: { path: true },
    });
    const image =
      record && (await downloadCategoryImage(record.path, productImageBucket));
    if (!image) return new Response(null, { status: 404, headers });
    return new Response(await image.arrayBuffer(), {
      headers: { ...headers, 'Content-Type': 'image/webp' },
    });
  } catch {
    return new Response(null, { status: 503, headers });
  }
}
