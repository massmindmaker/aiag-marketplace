import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin', 'cyrillic'] });

export const metadata: Metadata = {
  title: {
    default: 'AIAG - AI Models Marketplace',
    template: '%s | AIAG',
  },
  description:
    'Marketplace for AI models - LLM, image generation, audio, video and more. Find, compare and integrate AI APIs.',
  keywords: [
    'AI',
    'API',
    'LLM',
    'GPT',
    'image generation',
    'machine learning',
    'marketplace',
  ],
  authors: [{ name: 'AIAG Team' }],
  openGraph: {
    type: 'website',
    locale: 'ru_RU',
    siteName: 'AIAG',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
