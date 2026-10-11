import type { Metadata, Viewport } from 'next';
import { Cairo, Space_Grotesk, Tajawal } from 'next/font/google';

import { site } from '@/config/site';
import './globals.css';

// Arabic headings. `display: 'swap'` keeps first paint unblocked, but the
// result-card export waits on `document.fonts.ready` before capturing, so
// Arabic shaping is never rasterised against a fallback face.
const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  weight: ['400', '600', '700', '800', '900'],
  variable: '--font-cairo',
  display: 'swap',
});

// Arabic body copy — lighter and more compact than Cairo at reading sizes.
const tajawal = Tajawal({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '700', '800'],
  variable: '--font-tajawal',
  display: 'swap',
});

// Latin brand marks only (GDGoC / AASTMT ASWAN). Never used for Arabic.
const grotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['500', '700'],
  variable: '--font-grotesk',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: `${site.title} — ${site.organization} ${site.campus}`,
    template: `%s · ${site.title}`,
  },
  description:
    'جاوب على ١٠ أسئلة وشوف أنهي مسار في GDGoC AASTMT Aswan أقرب ليك، واختار شخصيتك وشارك الكارت.',
  applicationName: site.title,
  keywords: [
    'GDGoC',
    'AASTMT Aswan',
    'Google Developer Groups on Campus',
    'personality quiz',
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
  // Required for the safe-area insets used by the header and the quiz footer.
  viewportFit: 'cover',
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>): React.JSX.Element {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${cairo.variable} ${tajawal.variable} ${grotesk.variable}`}
    >
      <body className="bg-background text-text-primary">
        {children}
        <footer className="border-t border-surface-border/40 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] text-center">
          <a
            href={site.authorGitHub}
            target="_blank"
            rel="noopener noreferrer"
            dir="ltr"
            className="inline-block min-h-11 max-w-full py-2 font-brand text-sm text-text-secondary underline decoration-accent-gold/60 underline-offset-4 hover:text-accent-gold"
          >
            GitHub · AHMEDxHAGAG
          </a>
        </footer>
      </body>
    </html>
  );
}
