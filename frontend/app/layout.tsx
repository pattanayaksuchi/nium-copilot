import './globals.css';
import type { Metadata } from 'next';
import { QueryProvider } from '../src/components/QueryProvider';
import { ToastProvider } from '../src/components/Toast';

export const metadata: Metadata = {
  title: 'Nium Developer Copilot',
  description: 'AI-powered assistant for Nium integration teams',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full bg-subtle antialiased">
        <QueryProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
