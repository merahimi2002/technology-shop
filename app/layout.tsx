import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Tech Shop',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="fa" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
