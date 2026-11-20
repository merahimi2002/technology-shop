import { DevSkeletonPreview } from '@/components/dev-skeleton-preview';
import type { Metadata, Viewport } from 'next';
import { Suspense } from 'react';
import { SiteThemeProvider } from '@/components/site-theme-provider';
import { AuthProvider } from '@/components/auth-provider';
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
      className="[scrollbar-gutter:stable]"
      lang={locale}
      dir={locale === 'fa' ? 'rtl' : 'ltr'}
      data-theme="TechLight"
      suppressHydrationWarning
    >
      <body className="flex min-h-dvh flex-col bg-base-200 text-base-content ltr:[font-family:Arial,sans-serif]">
        <Suspense>
          <SiteThemeProvider>
            <LocaleProvider>
              <AuthProvider>
                {process.env.NODE_ENV === 'development' ? (
                  <DevSkeletonPreview>{children}</DevSkeletonPreview>
                ) : (
                  children
                )}
              </AuthProvider>
            </LocaleProvider>
          </SiteThemeProvider>
        </Suspense>
      </body>
    </html>
  );
}
