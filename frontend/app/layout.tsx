import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Nium Developer Copilot',
  description: 'Hybrid RAG Copilot for corridor validation and documentation lookup.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="container">{children}</div>
      </body>
    </html>
  );
}
