import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Discord Admin Panel - Современное управление сервером',
  description: 'Мощная админ панель для управления Discord сервером с модерацией, аналитикой и AI поддержкой',
  keywords: ['discord', 'admin', 'moderation', 'analytics', 'ai', 'bot'],
  authors: [{ name: 'Discord Bot Team' }],
  openGraph: {
    title: 'Discord Admin Panel',
    description: 'Современная админ панель для Discord серверов',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Discord Admin Panel',
    description: 'Современная админ панель для Discord серверов',
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
} 