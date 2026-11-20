import { Suspense } from 'react';
import { requireAdminUser } from '@/lib/auth/admin-session';
import { SettingsOverview } from '@/components/admin/settings-overview';
async function Settings({ params }: PageProps<'/[locale]/admin/settings'>) {
  const { locale } = await params;
  await requireAdminUser(locale, '/settings');
  return <SettingsOverview />;
}
export default function Page(props: PageProps<'/[locale]/admin/settings'>) {
  return (
    <Suspense>
      <Settings {...props} />
    </Suspense>
  );
}
