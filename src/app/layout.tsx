import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/providers/Providers';
import { Poppins, JetBrains_Mono } from 'next/font/google';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-jetbrains',
});

export const metadata: Metadata = {
  title: 'OmniWatch OS',
  description:
    'Intelligence, Surveillance, and Reconnaissance Command & Control Dashboard',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='en' suppressHydrationWarning className={`${poppins.variable} ${jetbrainsMono.variable}`} data-scroll-behavior='smooth'>
      <body suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
