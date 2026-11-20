import { Suspense } from 'react';
import { requireAdminUser } from '@/lib/auth/admin-session';
import { getSiteThemes } from '@/lib/site-settings';
import { DEFAULT_SITE_THEMES } from '@/lib/site-theme';
import { ThemeSettings } from '@/components/admin/theme-settings';
async function ThemePage({
  params,
}: PageProps<'/[locale]/admin/settings/theme'>) {
  const { locale } = await params;
  await requireAdminUser(locale, '/settings/theme');
  const current = await getSiteThemes();
  return <ThemeSettings current={current} />;
}
export default function Page(
  props: PageProps<'/[locale]/admin/settings/theme'>,
) {
  return (
    <Suspense
      fallback={<ThemeSettings current={DEFAULT_SITE_THEMES} loading />}
    >
      <ThemePage {...props} />
    </Suspense>
  );
}
