import type { Metadata } from 'next';
import '../globals.css';

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
    <>
      {children}
    </>
  );
}