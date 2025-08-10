import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import FooterStats from "./FooterStats";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://dork.example.com"),
  title: {
    default: "Google Dork Generator | Build Precise Search Operators",
    template: "%s | Dork Generator",
  },
  description:
    "Generate Google dork queries with site:, filetype:, inurl:, and more. Simple, fast, and SEO-optimized.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Google Dork Generator",
    description:
      "Build precise Google search queries using advanced operators like site:, filetype:, intitle:, and more.",
    url: "/",
    siteName: "Dork Generator",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Google Dork Generator",
    description:
      "Build precise Google search queries using advanced operators like site:, filetype:, intitle:, and more.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <FooterStats />
      </body>
    </html>
  );
}
