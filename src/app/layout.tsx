import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "E-Restaurant UK",
  description: "UK-ready online restaurant ordering with Shopify checkout",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en-GB"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-100 text-slate-900">
        <header className="border-b border-slate-200 bg-white/90">
          <nav className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
            <Link href="/" className="text-sm font-bold tracking-wide text-slate-900">
              E-Restaurant UK
            </Link>
            <Link href="/admin" className="text-sm font-medium text-slate-600 hover:text-slate-900">
              Admin
            </Link>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
