import { Suspense } from 'react';
import { requireAdminUser } from '@/lib/auth/admin-session';
import { listUsers, parseUserFilters } from '@/lib/admin/users';
import { AdminUsers, AdminUsersLoading } from '../admin-users';

async function AdminPanel({
  params,
  searchParams,
}: PageProps<'/[locale]/admin/users'>) {
  const { locale } = await params;
  const user = await requireAdminUser(locale, '/users');

  const filters = parseUserFilters(await searchParams);
  const result = await listUsers(filters, user.role);
  return (
    <AdminUsers
      filters={filters}
      result={result}
      canEdit={user.role === 'OWNER'}
      currentUserId={user.id}
    />
  );
}

export default function AdminUsersPage(
  props: PageProps<'/[locale]/admin/users'>,
) {
  return (
    <Suspense fallback={<AdminUsersLoading />}>
      <AdminPanel {...props} />
    </Suspense>
  );
}
