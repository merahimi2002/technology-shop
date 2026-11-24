import { notFound } from 'next/navigation';
import { requireAdminUser } from '@/lib/auth/admin-session';
import { getDb } from '@/lib/db';
import { AdminProductEditor } from '@/components/admin/admin-product-editor';

export default async function Page({
  params,
}: PageProps<'/[locale]/admin/products/[id]'>) {
  const { locale, id } = await params;
  await requireAdminUser(locale, `/products/${id}`);
  const db = getDb();
  const [product, categories] = await Promise.all([
    db.product.findUnique({
      where: { id },
      include: {
        variants: { orderBy: { createdAt: 'asc' } },
        images: { orderBy: { position: 'asc' }, select: { path: true } },
      },
    }),
    db.category.findMany({ orderBy: { slug: 'asc' } }),
  ]);
  if (!product) notFound();
  return (
    <AdminProductEditor
      key={product.updatedAt.toISOString()}
      categories={categories}
      imagePaths={product.images.map((image) => image.path)}
      product={{
        ...product,
        updatedAt: product.updatedAt.toISOString(),
        variants: product.variants.map((v) => ({
          id: v.id,
          sku: v.sku,
          nameFa: v.nameFa,
          nameEn: v.nameEn,
          price: v.price.toString(),
          stock: v.stock,
          isActive: v.isActive,
        })),
      }}
    />
  );
}
