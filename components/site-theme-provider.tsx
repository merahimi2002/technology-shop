import type { ReactNode } from 'react';
import { ThemeProvider } from '@/components/theme-provider';
import { getSiteThemes } from '@/lib/site-settings';
export async function SiteThemeProvider({ children }: { children: ReactNode }) {
  const themes = await getSiteThemes();
  return <ThemeProvider siteThemes={themes}>{children}</ThemeProvider>;
}
