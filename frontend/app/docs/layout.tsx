import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Nium Docs - Move Money Globally',
  description: 'Documentation for Nium\'s global payment infrastructure. Build, scale, and launch financial products with comprehensive APIs and guides.',
};

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script src="/widget-config.js"></script>
      </head>
      <body>
        {children}
        
        {/* Nium Copilot Widget Script */}
        <script src="/embed-simple.js" async></script>
      </body>
    </html>
  );
}