import type { Metadata, Viewport } from 'next';
import { Cairo, Pirata_One } from 'next/font/google';

import { site } from '@/config/site';
import './globals.css';

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  weight: ['400', '600', '700', '800'],
  variable: '--font-cairo',
  display: 'swap',
});

const pirataOne = Pirata_One({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-pirata',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: `${site.title} — ${site.organization} ${site.campus}`,
    template: `%s · ${site.title}`,
  },
  description:
    'رحلة قراصان تفاعلية: جاوب على كام موقف مع الكابتن، واكتشف أنهي قرصان من Trackات GDGoC AASTMT Aswan يشبهك.',
  applicationName: site.title,
  keywords: [
    'GDGoC',
    'AASTMT Aswan',
    'Google Developer Groups on Campus',
    'pirate expedition',
    'tracks',
    'orientation',
  ],
  robots: { index: true, follow: true },
  openGraph: {
    title: `${site.title} — ${site.organization} ${site.campus}`,
    description: site.taglineAr,
    locale: 'ar_EG',
    type: 'website',
  },
  twitter: { card: 'summary_large_image' },
};

export const viewport: Viewport = {
  themeColor: site.themeColor,
  width: 'device-width',
  initialScale: 1,
  // Required for the safe-area insets used by the composer and the header.
  viewportFit: 'cover',
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>): React.JSX.Element {
  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} ${pirataOne.variable}`}>
      <body className="bg-parchment-300 text-ink">{children}</body>
    </html>
  );
}
