import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "The British Table – Online Restaurant",
  description:
    "Order delicious food online from The British Table, delivered to your door across the UK.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-GB" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-stone-50 text-stone-900 font-sans">
        <header className="bg-stone-900 text-white shadow-md">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <Link href="/" className="text-xl font-bold tracking-tight hover:text-amber-400 transition-colors">
              🍽️ The British Table
            </Link>
            <nav className="flex gap-6 text-sm font-medium">
              <Link href="/" className="hover:text-amber-400 transition-colors">
                Menu
              </Link>
              <Link href="/admin" className="hover:text-amber-400 transition-colors">
                Admin
              </Link>
            </nav>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="bg-stone-900 text-stone-400 text-sm text-center py-4 mt-8">
          © {new Date().getFullYear()} The British Table · UK · All prices include VAT
        </footer>
      </body>
    </html>
  );
}
