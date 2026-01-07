import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import ThemeProvider from '@/components/providers/ThemeProvider';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Snippet Factory - AI-Powered Code Snippet Manager',
  description: 'Revolutionary code snippet manager with AI categorization, team collaboration, and enterprise security. Transform your development workflow today.',
  keywords: 'code snippets, AI, developer tools, team collaboration, code management, productivity',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider>
          {children}
        </ThemeProvider>
        {/* Google AdSense Script - Loaded after hydration */}
        {process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID && (
          <Script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID}`}
            crossOrigin="anonymous"
            strategy="afterInteractive"
          />
        )}
      </body>
    </html>
  );
}
