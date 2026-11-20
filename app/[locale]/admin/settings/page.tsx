import { Suspense } from 'react';
import { redirect } from 'next/navigation';
async function Settings({ params }: PageProps<'/[locale]/admin/settings'>) {
  const { locale } = await params;
  return redirect(`/${locale}/admin/settings/theme`);
}
export default function Page(props: PageProps<'/[locale]/admin/settings'>) {
  return (
    <Suspense>
      <Settings {...props} />
    </Suspense>
  );
}
