import type { Metadata, Viewport } from "next";
import { fontVariables } from "@/lib/fonts";
import { siteConfig } from "@/config/site";
import "./globals.css";

// The Next.js Metadata API replaces the hand-written <meta>/OG/Twitter tags
// from the original index.html <head>.
export const metadata: Metadata = {
  // Base URL for resolving absolute OG/Twitter image URLs. Override via
  // NEXT_PUBLIC_SITE_URL in production (e.g. https://omniwatch.example).
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: siteConfig.title,
  description: siteConfig.description,
  icons: {
    icon: siteConfig.ogImage,
    apple: siteConfig.ogImage,
  },
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
    title: siteConfig.title,
    description: siteConfig.socialDescription,
    images: [{ url: siteConfig.ogImage }],
  },
  twitter: {
    card: "summary",
    title: siteConfig.title,
    description: siteConfig.socialDescription,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={fontVariables}>
      <body>{children}</body>
    </html>
  );
}
