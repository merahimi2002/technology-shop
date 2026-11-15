import { Suspense } from 'react';
import { notFound, redirect } from 'next/navigation';
import { canAccessAdmin } from '@/lib/auth/admin-access';
import { getCurrentUser } from '@/lib/auth/session';
import { AdminIntro } from './admin-intro';

async function AdminPanel({ params }: PageProps<'/[locale]/admin'>) {
  const { locale } = await params;
  if (locale !== 'fa' && locale !== 'en') notFound();

  const user = await getCurrentUser();
  const accountPath = `/${locale}/account`;
  if (!user) {
    const query = new URLSearchParams({ callbackUrl: `/${locale}/admin` });
    redirect(`${accountPath}?${query}`);
  }
  if (!canAccessAdmin(user.role)) redirect(accountPath);

  return (
    <main
      id="main-content"
      className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-8"
    >
      <div className="card bg-base-100">
        <div className="card-body">
          <AdminIntro />
        </div>
      </div>
    </main>
  );
}

export default function AdminPage(props: PageProps<'/[locale]/admin'>) {
  return (
    <Suspense fallback={null}>
      <AdminPanel {...props} />
    </Suspense>
  );
}
