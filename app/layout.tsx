import type { Metadata } from 'next';
import { Open_Sans } from 'next/font/google';
import './globals.css';
import { SWRProvider } from '@/lib/swr-config';

const openSans = Open_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-open-sans',
});

export const metadata: Metadata = {
  title: 'HarryBotter Portal - Tech Tools',
  description: 'Internal ticket management system for FoodStyles Tech Team',
  icons: {
    icon: '/favicon.ico',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={openSans.variable}>
      <body className="font-sans">
        <SWRProvider>{children}</SWRProvider>
      </body>
    </html>
  );
}
