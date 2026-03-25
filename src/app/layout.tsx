import type { Metadata } from "next";
import { Geist_Mono, Manrope, Playfair_Display } from "next/font/google";
import { CartProvider } from "@/components/CartProvider";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import "./globals.css";

const bodyFont = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
});

const headingFont = Playfair_Display({
  variable: "--font-heading",
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
      className={`${bodyFont.variable} ${headingFont.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[var(--background)] text-[var(--foreground)]">
        <CartProvider>
          <SiteHeader />
          {children}
          <SiteFooter />
        </CartProvider>
      </body>
    </html>
  );
}
