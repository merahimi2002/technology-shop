import type { Metadata, Viewport } from 'next';
import { ThemeProvider } from '@/components/theme-provider';
import { SiteHeader } from '@/components/store/site-header';
import { THEME_BOOTSTRAP } from '@/lib/theme';
import './globals.css';

export const metadata: Metadata = { title: 'Tech Shop' };
export const viewport: Viewport = { themeColor: '#F5F7FA' };

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="fa" dir="rtl" data-theme="nord" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} />
      </head>
      <body className="flex min-h-dvh flex-col bg-base-200 text-base-content">
        <ThemeProvider>
          <SiteHeader />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
