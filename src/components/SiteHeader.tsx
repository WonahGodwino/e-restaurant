"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/components/CartProvider";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/menu", label: "Menu" },
  { href: "/reservations", label: "Reservations" },
  { href: "/catering", label: "Catering" },
  { href: "/order-status", label: "Track Order" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export default function SiteHeader() {
  const pathname = usePathname();
  const { totalItems } = useCart();

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[color:rgba(10,15,26,0.82)] backdrop-blur-xl">
      <nav className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3 text-white transition hover:opacity-90">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-lg shadow-[0_0_30px_rgba(127,86,217,0.25)]">
            🍽
          </span>
          <span>
            <span className="font-heading block text-lg leading-none">E-Restaurant</span>
            <span className="text-xs uppercase tracking-[0.3em] text-white/60">African Kitchen UK</span>
          </span>
        </Link>

        <div className="hidden items-center gap-2 md:flex">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "rounded-full px-4 py-2 text-sm font-medium transition",
                  active
                    ? "bg-white/10 text-white"
                    : "text-white/70 hover:bg-white/8 hover:text-white",
                ].join(" ")}
              >
                {item.label}
              </Link>
            );
          })}

          <Link
            href="/cart"
            className="relative rounded-full border border-white/15 bg-white/6 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Cart
            {totalItems > 0 ? (
              <span className="ml-2 inline-flex min-w-6 items-center justify-center rounded-full bg-[var(--accent-strong)] px-2 py-0.5 text-xs text-white">
                {totalItems}
              </span>
            ) : null}
          </Link>

          <Link href="/admin" className="rounded-full border border-[var(--accent)]/40 bg-[var(--accent)]/12 px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(127,86,217,0.18)] transition hover:bg-[var(--accent)]/20">
            Admin
          </Link>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <Link href="/menu" className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white">
            Menu
          </Link>
          <Link href="/cart" className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white">
            Cart{totalItems > 0 ? ` (${totalItems})` : ""}
          </Link>
        </div>
      </nav>
    </header>
  );
}