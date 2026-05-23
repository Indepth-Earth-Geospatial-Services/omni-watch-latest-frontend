import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/providers/Providers';
import { Poppins } from 'next/font/google';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
});

export const metadata: Metadata = {
  title: 'ISR Command & Control System',
  description:
    'Intelligence, Surveillance, and Reconnaissance Command & Control Dashboard',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='en' suppressHydrationWarning className={poppins.variable}>
      <body style={{ fontFamily: 'Inter, sans-serif' }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
