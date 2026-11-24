import { requireAdminUser } from '@/lib/auth/admin-session';
import { getDb } from '@/lib/db';
import type { Prisma } from '@/generated/prisma/client';
import { parseProductFilters } from '@/lib/admin/product-input';
import { AdminProducts } from '@/components/admin/admin-products';

export default async function Page({
  params,
  searchParams,
}: PageProps<'/[locale]/admin/products'>) {
  const { locale } = await params;
  await requireAdminUser(locale, '/products');
  const filters = parseProductFilters(await searchParams);
  const db = getDb();
  const contains = filters.q.replace(/[\\%_]/g, '\\$&');
  const where: Prisma.ProductWhereInput = {
    ...(filters.status && { status: filters.status }),
    ...(filters.category && { categoryId: filters.category }),
    ...(contains && {
      OR: [
        { nameFa: { contains, mode: 'insensitive' } },
        { nameEn: { contains, mode: 'insensitive' } },
        { slug: { contains, mode: 'insensitive' } },
        { variants: { some: { sku: { contains, mode: 'insensitive' } } } },
      ],
    }),
  };
  const [total, categories] = await Promise.all([
    db.product.count({ where }),
    db.category.findMany({ orderBy: { slug: 'asc' } }),
  ]);
  const pages = Math.max(1, Math.ceil(total / filters.pageSize));
  const page = Math.min(filters.page, pages);
  const products = await db.product.findMany({
    where,
    include: {
      variants: { orderBy: { createdAt: 'asc' } },
      images: { orderBy: { position: 'asc' }, take: 1, select: { path: true } },
    },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    skip: (page - 1) * filters.pageSize,
    take: filters.pageSize,
  });
  return (
    <AdminProducts
      filters={filters}
      categories={categories}
      total={total}
      page={page}
      pages={pages}
      products={products.map(({ images, ...p }) => ({
        ...p,
        updatedAt: p.updatedAt.toISOString(),
        createdAt: undefined,
        coverPath: images[0]?.path ?? null,
        variants: p.variants.map((v) => ({
          id: v.id,
          sku: v.sku,
          nameFa: v.nameFa,
          nameEn: v.nameEn,
          price: v.price.toString(),
          stock: v.stock,
          isActive: v.isActive,
        })),
      }))}
    />
  );
}
