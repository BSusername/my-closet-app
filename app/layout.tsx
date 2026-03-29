import type { Metadata, Viewport } from 'next';
import { Instrument_Serif, Nunito_Sans } from 'next/font/google';
import './globals.css';

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-instrument-serif',
  display: 'swap',
});

const nunitoSans = Nunito_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-nunito-sans',
  display: 'swap',
  adjustFontFallback: false,
});

export const metadata: Metadata = {
  title: 'My Closet',
  description: 'Your personal digital wardrobe',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'My Closet',
  },
  icons: {
    icon: '/icons/icon-192x192.png',
    apple: '/icons/icon-192x192.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#2e2038',
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
    <html lang="en">
      <body className={`${instrumentSerif.variable} ${nunitoSans.variable}`}>
        {children}
      </body>
    </html>
  );
}
