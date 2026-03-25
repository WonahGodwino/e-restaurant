"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/components/CartProvider";
import { formatGBP } from "@/lib/currency";

export default function CartPageClient() {
  const { items, subtotalPence, updateQuantity, clearCart } = useCart();
  const totalPence = subtotalPence;

  if (items.length === 0) {
    return (
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-16 sm:px-6 lg:px-8">
        <div className="surface-panel rounded-[2rem] p-10 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white/6 text-4xl">🛒</div>
          <h1 className="mt-6 text-3xl font-semibold text-white">Your cart is empty</h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-white/64">
            Start with the menu, add dishes you want, and come back here to review before checkout.
          </p>
          <Link href="/menu" className="mt-8 inline-flex rounded-full bg-[var(--accent-strong)] px-6 py-3 text-sm font-semibold text-white shadow-[0_16px_35px_rgba(240,90,40,0.22)]">
            Browse Menu
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--cream)]/70">Review order</p>
          <h1 className="font-heading mt-3 text-4xl text-white">Your Cart</h1>
        </div>
        <button type="button" onClick={clearCart} className="rounded-full border border-white/12 bg-white/6 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10">
          Clear cart
        </button>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.55fr_0.9fr]">
        <section className="space-y-4">
          {items.map((item) => (
            <article key={item.cartKey} className="surface-panel flex flex-col gap-5 rounded-[1.75rem] p-5 sm:flex-row">
              {item.imageUrl ? (
                <Image src={item.imageUrl} alt={item.name} width={220} height={180} className="h-40 w-full rounded-[1.25rem] object-cover sm:w-48" />
              ) : (
                <div className="flex h-40 w-full items-center justify-center rounded-[1.25rem] bg-[linear-gradient(135deg,rgba(127,86,217,0.22),rgba(240,90,40,0.18))] text-5xl sm:w-48">
                  🍽
                </div>
              )}

              <div className="flex flex-1 flex-col justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-white/45">{item.category}</p>
                      <h2 className="mt-2 text-xl font-semibold text-white">{item.name}</h2>
                    </div>
                    <span className="text-base font-semibold text-white">{formatGBP(item.effectivePricePence * item.quantity)}</span>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-white/66">{item.description}</p>

                  {/* Selected modifiers */}
                  {item.selectedModifiers && item.selectedModifiers.length > 0 ? (
                    <ul className="mt-3 space-y-1">
                      {item.selectedModifiers.map((mod) => (
                        <li key={mod.modifierId} className="flex items-center justify-between gap-2 text-xs text-white/60">
                          <span>
                            <span className="text-white/40">{mod.groupName}:</span>{" "}
                            <span className="text-white/75">{mod.modifierName}</span>
                          </span>
                          {mod.priceDeltaPence !== 0 && (
                            <span className={mod.priceDeltaPence > 0 ? "text-[var(--cream)]/70" : "text-emerald-300/70"}>
                              {mod.priceDeltaPence > 0 ? "+" : ""}{formatGBP(mod.priceDeltaPence)}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>

                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => updateQuantity(item.cartKey, item.quantity - 1)} className="flex h-10 w-10 items-center justify-center rounded-full border border-white/12 bg-white/6 text-lg text-white hover:bg-white/10">-</button>
                  <span className="min-w-10 text-center text-base font-semibold text-white">{item.quantity}</span>
                  <button type="button" onClick={() => updateQuantity(item.cartKey, item.quantity + 1)} className="flex h-10 w-10 items-center justify-center rounded-full border border-white/12 bg-white/6 text-lg text-white hover:bg-white/10">+</button>
                </div>
              </div>
            </article>
          ))}
        </section>

        <aside className="surface-panel h-fit rounded-[1.8rem] p-5 lg:sticky lg:top-24">
          <h2 className="text-2xl font-semibold text-white">Order Summary</h2>
          <div className="mt-5 space-y-3 text-sm text-white/68">
            <div className="flex items-center justify-between"><span>Subtotal</span><span>{formatGBP(subtotalPence)}</span></div>
            <div className="flex items-center justify-between"><span>Delivery</span><span>Chosen at checkout</span></div>
            <div className="flex items-center justify-between border-t border-white/10 pt-3 text-base font-semibold text-white"><span>Total</span><span>{formatGBP(totalPence)}</span></div>
          </div>

          <div className="mt-5 rounded-[1.25rem] border border-white/8 bg-white/4 p-4 text-xs uppercase tracking-[0.16em] text-white/50">
            By continuing to checkout, you accept the published delivery terms, refund policy,
            allergy disclaimer, and privacy terms.
          </div>

          <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium text-white/66">
            <Link href="/terms-and-conditions" className="rounded-full border border-white/10 bg-white/6 px-3 py-1 transition hover:bg-white/10 hover:text-white">Terms</Link>
            <Link href="/privacy-policy" className="rounded-full border border-white/10 bg-white/6 px-3 py-1 transition hover:bg-white/10 hover:text-white">Privacy</Link>
            <Link href="/delivery-policy" className="rounded-full border border-white/10 bg-white/6 px-3 py-1 transition hover:bg-white/10 hover:text-white">Delivery</Link>
            <Link href="/refund-policy" className="rounded-full border border-white/10 bg-white/6 px-3 py-1 transition hover:bg-white/10 hover:text-white">Refund</Link>
            <Link href="/allergy-disclaimer" className="rounded-full border border-white/10 bg-white/6 px-3 py-1 transition hover:bg-white/10 hover:text-white">Allergy</Link>
          </div>

          <div className="mt-6 space-y-3">
            <Link href="/checkout" className="block rounded-full bg-[var(--accent-strong)] px-4 py-3 text-center text-sm font-semibold text-white shadow-[0_16px_35px_rgba(240,90,40,0.22)]">
              Proceed to Checkout
            </Link>
            <Link href="/menu" className="block rounded-full border border-white/12 bg-white/6 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-white/10">
              Continue Shopping
            </Link>
            <Link href="/order-status" className="block rounded-full border border-white/12 bg-white/6 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-white/10">
              Track an existing order
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
