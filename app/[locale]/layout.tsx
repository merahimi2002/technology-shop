import type { Metadata, Viewport } from 'next';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/components/auth-provider';
import { SiteHeader } from '@/components/store/site-header';
import '../globals.css';
import { LocaleProvider } from '@/components/locale-provider';
import { notFound } from 'next/navigation';
import fa from '@/messages/fa.json';
import en from '@/messages/en.json';

export async function generateMetadata({
  params,
}: LayoutProps<'/[locale]'>): Promise<Metadata> {
  const { locale } = await params;
  if (locale !== 'fa' && locale !== 'en') notFound();
  return { title: (locale === 'en' ? en : fa).brand.name };
}
export const viewport: Viewport = { themeColor: '#F5F7FA' };

export function generateStaticParams() {
  return [{ locale: 'fa' }, { locale: 'en' }];
}
export default async function RootLayout({
  children,
  params,
}: LayoutProps<'/[locale]'>) {
  const { locale } = await params;
  if (locale !== 'fa' && locale !== 'en') notFound();
  return (
    <html
      lang={locale}
      dir={locale === 'fa' ? 'rtl' : 'ltr'}
      data-theme="nord"
      suppressHydrationWarning
    >
      <body className="flex min-h-dvh flex-col bg-base-200 text-base-content ltr:[font-family:Arial,sans-serif]">
        <ThemeProvider>
          <LocaleProvider>
            <AuthProvider>
              <SiteHeader />
              {children}
            </AuthProvider>
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
