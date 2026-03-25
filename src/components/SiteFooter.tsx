import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-white/10 bg-[var(--surface-strong)] text-white/72">
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.4fr_0.9fr_0.9fr_1.2fr] lg:px-8">
        <div>
          <div className="mb-4 flex items-center gap-3 text-white">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-lg">
              🍲
            </span>
            <div>
              <p className="font-heading text-xl">E-Restaurant</p>
              <p className="text-xs uppercase tracking-[0.28em] text-white/45">Modern African Dining</p>
            </div>
          </div>
          <p className="max-w-md text-sm leading-7 text-white/62">
            A refined online ordering experience for African dishes, built for UK-ready checkout,
            clear pricing, and a smoother path from discovery to delivery.
          </p>
        </div>

        <div>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.22em] text-white/45">Explore</h2>
          <div className="space-y-3 text-sm">
            <Link href="/" className="block transition hover:text-white">Home</Link>
            <Link href="/menu" className="block transition hover:text-white">Menu</Link>
            <Link href="/order-status" className="block transition hover:text-white">Track order</Link>
            <Link href="/about" className="block transition hover:text-white">About</Link>
            <Link href="/contact" className="block transition hover:text-white">Contact</Link>
          </div>
        </div>

        <div>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.22em] text-white/45">Policies</h2>
          <div className="space-y-3 text-sm">
            <Link href="/privacy-policy" className="block transition hover:text-white">Privacy policy</Link>
            <Link href="/terms-and-conditions" className="block transition hover:text-white">Terms and conditions</Link>
            <Link href="/delivery-policy" className="block transition hover:text-white">Delivery policy</Link>
            <Link href="/refund-policy" className="block transition hover:text-white">Refund policy</Link>
            <Link href="/allergy-disclaimer" className="block transition hover:text-white">Allergy disclaimer</Link>
          </div>
        </div>

        <div>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.22em] text-white/45">Contact</h2>
          <div className="space-y-3 text-sm leading-6">
            <p>London-focused delivery setup</p>
            <a href="mailto:hello@e-restaurant.com" className="block transition hover:text-white">hello@e-restaurant.com</a>
            <p>Mon-Sun: 11:00 - 22:30</p>
            <p className="text-white/55">Order support: use Track order with your order ID and checkout email.</p>
            <p className="text-white/50">Built for restaurant operations, admin workflows, and secure online orders.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}