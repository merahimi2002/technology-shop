import { AdminCategories } from '@/components/admin/admin-categories';
export default function Loading() {
  return (
    <AdminCategories loading categories={[]} page={1} pages={1} pageSize={20} />
  );
}
