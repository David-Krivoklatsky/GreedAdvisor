import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import React from 'react';
import { ErrorBoundary } from '../components/error-boundary';
import { ToastProvider } from '../components/ui/toast';
import ThemeProvider from '../components/theme/theme-provider';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'GreedAdvisor',
  description: 'Manage your AI and Trading API keys securely',
  icons: {
    icon: '/GA.png',
    shortcut: '/GA.png',
    apple: '/GA.png'
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <ToastProvider>
            <ErrorBoundary>
              <div className="min-h-screen bg-background">{children}</div>
            </ErrorBoundary>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
