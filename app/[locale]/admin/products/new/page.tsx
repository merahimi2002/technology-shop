import { requireAdminUser } from '@/lib/auth/admin-session';
import { getDb } from '@/lib/db';
import { AdminProductEditor } from '@/components/admin/admin-product-editor';

export default async function Page({
  params,
}: PageProps<'/[locale]/admin/products/new'>) {
  const { locale } = await params;
  await requireAdminUser(locale, '/products/new');
  const categories = await getDb().category.findMany({
    orderBy: { slug: 'asc' },
  });
  return <AdminProductEditor categories={categories} />;
}
