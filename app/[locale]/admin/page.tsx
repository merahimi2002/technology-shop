import { Suspense } from 'react';
import { notFound, redirect } from 'next/navigation';
import { canAccessAdmin } from '@/lib/auth/admin-access';
import { getCurrentUser } from '@/lib/auth/session';
import fa from '@/messages/fa.json';
import en from '@/messages/en.json';

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

  const { account } = locale === 'fa' ? fa : en;
  return (
    <main
      id="main-content"
      className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-8"
    >
      <div className="card bg-base-100">
        <div className="card-body">
          <h1 className="card-title">{account.adminPanel}</h1>
          <p>{account.adminLanding}</p>
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
