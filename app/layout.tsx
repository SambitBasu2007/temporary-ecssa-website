import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";

import "./globals.css";

const title = "ECSSA — Electronics & Computer Science Student Association";
const description =
  "Official student association bridging electronics and computer science through innovation, collaboration, and inspiration.";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title,
  description,
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
  openGraph: {
    type: "website",
    title,
    description,
    siteName: "ECSSA",
    images: [
      {
        url: "/landingpage/og-image.png",
        width: 1200,
        height: 630,
        alt: "ECSSA — Electronics and Computer Science Student Association",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/landingpage/og-image.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`no-js ${GeistSans.variable}`} suppressHydrationWarning>
      <body className={GeistSans.className}>{children}</body>
    </html>
  );
}
