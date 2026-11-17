import { Suspense } from 'react';
import { requireAdminUser } from '@/lib/auth/admin-session';

async function Dashboard({ params }: PageProps<'/[locale]/admin'>) {
  const { locale } = await params;
  await requireAdminUser(locale);
  return <main className="flex-1" />;
}

export default function AdminPage(props: PageProps<'/[locale]/admin'>) {
  return (
    <Suspense>
      <Dashboard {...props} />
    </Suspense>
  );
}
