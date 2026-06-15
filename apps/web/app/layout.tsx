import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '../components/Providers';

export const metadata: Metadata = {
  title: 'GON — AI Marketing Team',
  description: 'Autonomous AI-powered marketing platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
