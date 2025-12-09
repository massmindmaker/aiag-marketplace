import type { Metadata } from 'next';
import { Roboto } from 'next/font/google';
import ThemeRegistry from '@/theme/ThemeRegistry';
import { Providers } from '@/components/providers/Providers';
import './globals.css';

const roboto = Roboto({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin', 'cyrillic'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'AI Aggregator - Маркетплейс алгоритмов ИИ',
    template: '%s | AI Aggregator',
  },
  description:
    'Маркетплейс алгоритмов искусственного интеллекта. Алгоритмы ИИ - быстро, просто, недорого.',
  keywords: [
    'AI',
    'ИИ',
    'API',
    'LLM',
    'машинное обучение',
    'маркетплейс',
    'алгоритмы',
  ],
  authors: [{ name: 'AI Aggregator Team' }],
  openGraph: {
    type: 'website',
    locale: 'ru_RU',
    siteName: 'AI Aggregator',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className={roboto.className}>
        <Providers>
          <ThemeRegistry>{children}</ThemeRegistry>
        </Providers>
      </body>
    </html>
  );
}
