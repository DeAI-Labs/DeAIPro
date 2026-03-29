import type { Metadata, Viewport } from 'next';
import { ReactNode } from 'react';
import './globals.css';
import { QueryProvider } from '@/lib/queryClient';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AuthProvider } from '@/lib/authContext';

export const metadata: Metadata = {
  title: 'DeAIPro - Bittensor Intelligence Analytics',
  description:
    'Real-time analytics, subnet metrics, and market intelligence for the Bittensor ecosystem',
  keywords: 'bittensor, analytics, subnets, blockchain, AI, intelligence',
  authors: [{ name: 'DeAI Strategies' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://deai-zeta.vercel.app',
    siteName: 'DeAIPro',
    title: 'DeAIPro - Bittensor Intelligence Analytics',
    description: 'Real-time analytics and intelligence platform for Bittensor',
    images: [
      {
        url: 'https://deai-zeta.vercel.app/og-image.png',
        width: 1200,
        height: 630,
        alt: 'DeAIPro',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DeAIPro - Bittensor Intelligence Analytics',
    description: 'Real-time analytics and intelligence for Bittensor',
    images: ['https://deai-zeta.vercel.app/og-image.png'],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#2563eb',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#2563eb" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500;600;700&family=Syne:wght@600;700;800&family=Playfair+Display:ital,wght@0,700;0,900;1,700;1,900&family=DM+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body>
        <ErrorBoundary>
          <QueryProvider>
            <AuthProvider>
              {children}
            </AuthProvider>
          </QueryProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
