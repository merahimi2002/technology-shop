import { Suspense } from 'react';
import { requireAdminUser } from '@/lib/auth/admin-session';
import { listUsers, parseUserFilters } from '@/lib/admin/users';
import { AdminUsers } from '../admin-users';
import { AdminUsersLoading } from '@/components/admin/admin-users-skeleton';

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

export default async function AdminUsersPage(
  props: PageProps<'/[locale]/admin/users'>,
) {
  const filters = parseUserFilters(await props.searchParams);
  return (
    <Suspense
      key={JSON.stringify(filters)}
      fallback={<AdminUsersLoading filters={filters} />}
    >
      <AdminPanel {...props} />
    </Suspense>
  );
}
