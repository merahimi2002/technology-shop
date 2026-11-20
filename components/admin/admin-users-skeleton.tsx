'use client';

import { useSession } from 'next-auth/react';
import { AdminUsers } from '@/app/[locale]/admin/admin-users';
import { DEFAULT_PAGE_SIZE } from '@/lib/pagination';
import type { UserFilters } from '@/lib/admin/users';

export function AdminUsersLoading({ filters }: { filters?: UserFilters }) {
  const { data: session } = useSession();
  return (
    <AdminUsers
      loading
      filters={
        filters ?? {
          q: '',
          role: '',
          status: '',
          page: 1,
          pageSize: DEFAULT_PAGE_SIZE,
          sort: '',
          direction: 'desc',
        }
      }
      result={{
        users: [],
        total: 0,
        pages: filters?.page ?? 1,
        page: filters?.page ?? 1,
      }}
      canEdit={session?.user?.role === 'OWNER'}
      currentUserId={session?.user?.id ?? ''}
    />
  );
}
