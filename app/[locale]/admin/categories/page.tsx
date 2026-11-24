import { requireAdminUser } from '@/lib/auth/admin-session';
import { getDb } from '@/lib/db';
import { AdminCategories } from '@/components/admin/admin-categories';
import { parseProductFilters } from '@/lib/admin/product-input';

export default async function Page({
  params,
  searchParams,
}: PageProps<'/[locale]/admin/categories'>) {
  const { locale } = await params;
  await requireAdminUser(locale, '/categories');
  const filters = parseProductFilters(await searchParams);
  const db = getDb();
  const total = await db.category.count();
  const pages = Math.max(1, Math.ceil(total / filters.pageSize));
  const page = Math.min(filters.page, pages);
  const categories = await db.category.findMany({
    orderBy: { slug: 'asc' },
    include: { _count: { select: { products: true } } },
    skip: (page - 1) * filters.pageSize,
    take: filters.pageSize,
  });
  return (
    <AdminCategories
      categories={categories}
      total={total}
      page={page}
      pages={pages}
      pageSize={filters.pageSize}
    />
  );
}
