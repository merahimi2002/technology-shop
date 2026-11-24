import { requireAdminUser } from '@/lib/auth/admin-session';
import { AdminCategoryEditor } from '@/components/admin/admin-category-editor';
import { getDb } from '@/lib/db';
import { notFound } from 'next/navigation';

export default async function Page({
  params,
  searchParams,
}: PageProps<'/[locale]/admin/categories/new'>) {
  const { locale } = await params;
  await requireAdminUser(locale, '/categories/new');
  const { edit } = await searchParams;
  if (
    edit !== undefined &&
    (typeof edit !== 'string' || !edit || edit.length > 100)
  )
    notFound();
  const category =
    typeof edit === 'string'
      ? await getDb().category.findUnique({ where: { id: edit } })
      : null;
  if (edit && !category) notFound();
  return (
    <AdminCategoryEditor
      key={category ? JSON.stringify(category) : 'new'}
      category={category ?? undefined}
    />
  );
}
