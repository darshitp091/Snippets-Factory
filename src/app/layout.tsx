import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
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
    <html lang="en" className="dark" data-scroll-behavior="smooth">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}
