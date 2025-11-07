import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import ErrorBoundary from "@/components/ErrorBoundary";
import Navigation from "@/components/layout/Navigation";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DropSpot - Discover Amazing Drops",
  description: "Join exclusive drops, participate in limited-time events, and claim your spot in the most exciting digital experiences.",
  keywords: "drops, exclusive, limited, claims, digital experiences",
  authors: [{ name: "DropSpot Team" }],
  viewport: "width=device-width, initial-scale=1",
  robots: "index, follow",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased overflow-x-hidden`}
      >
        <ErrorBoundary>
          <Providers>
            <Navigation />
            <main className="min-h-screen">
              {children}
            </main>
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}
