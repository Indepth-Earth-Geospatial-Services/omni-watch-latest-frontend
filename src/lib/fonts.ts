import { Geist, Geist_Mono, Inter, JetBrains_Mono } from "next/font/google";
import localFont from "next/font/local";

// Satoshi is a proprietary Fontshare font (not on Google Fonts). We self-host
// the woff2 files via next/font/local so there's no external CDN request.
export const satoshi = localFont({
  src: [
    { path: "../fonts/Satoshi-Regular.woff2", weight: "400", style: "normal" },
    { path: "../fonts/Satoshi-Medium.woff2", weight: "500", style: "normal" },
    { path: "../fonts/Satoshi-Bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-satoshi",
  display: "swap",
});

// Self-hosted via next/font — no render-blocking <link> requests, zero layout shift.
// Each font exposes a CSS variable consumed by the Tailwind theme (tailwind.config.ts).
export const geist = Geist({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-geist",
  display: "swap",
});

export const geistMono = Geist_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-geist-mono",
  display: "swap",
});

export const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

export const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

// Combined class string for the <html> element.
export const fontVariables = [
  satoshi.variable,
  geist.variable,
  geistMono.variable,
  inter.variable,
  jetbrainsMono.variable,
].join(" ");
