import type { ReactNode } from 'react';
import { AdminPageFrame } from '@/components/admin/admin-page-frame';

export default function Layout({ children }: { children: ReactNode }) {
  return <AdminPageFrame page="users">{children}</AdminPageFrame>;
}
