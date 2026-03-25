"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/components/CartProvider";
import ModifierSelectorModal from "@/components/ModifierSelectorModal";
import type { MenuItem } from "@/types";
import type { SelectedModifier } from "@/components/CartProvider";
import { formatGBP } from "@/lib/currency";

type Props = {
  items: MenuItem[];
};

export default function MenuOrderClient({ items }: Props) {
  const { addItem, items: cartItems, subtotalPence, updateQuantity, totalItems } = useCart();
  const [pendingItem, setPendingItem] = useState<MenuItem | null>(null);

  const grouped = useMemo(() => {
    const result: Record<string, MenuItem[]> = {};
    for (const item of items) {
      if (!result[item.category]) {
        result[item.category] = [];
      }
      result[item.category].push(item);
    }
    return result;
  }, [items]);

  function handleAddToBasket(entry: MenuItem) {
    if (entry.modifierGroups && entry.modifierGroups.length > 0) {
      setPendingItem(entry);
    } else {
      addItem(entry);
    }
  }

  function handleModifierConfirm(selectedModifiers: SelectedModifier[]) {
    if (pendingItem) {
      addItem(pendingItem, selectedModifiers);
      setPendingItem(null);
    }
  }

  return (
    <div id="order-section" className="grid gap-8 lg:grid-cols-[1.7fr_0.92fr]">
      {pendingItem && (
        <ModifierSelectorModal
          item={pendingItem}
          onConfirm={handleModifierConfirm}
          onClose={() => setPendingItem(null)}
        />
      )}

      <section className="space-y-10">
        {Object.entries(grouped).map(([category, entries]) => (
          <div key={category} className="space-y-4" id={`category-${category.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--cream)]/60">Menu category</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">{category}</h2>
              </div>
              <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs font-semibold text-white/65">
                {entries.length} item{entries.length === 1 ? "" : "s"}
              </span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {entries.map((entry, index) => {
                // Sum up all quantities for this food item across all cart entries (diff modifiers)
                const cartEntriesForItem = cartItems.filter((item) => item.id === entry.id);
                const totalQty = cartEntriesForItem.reduce((s, e) => s + e.quantity, 0);
                // For +/- controls we work with the first matching cart entry (no-modifier)
                const simpleCartEntry = cartItems.find((item) => item.cartKey === entry.id);
                const simpleQty = simpleCartEntry?.quantity ?? 0;

                return (
                  <article
                    key={entry.id}
                    className="overflow-hidden rounded-[1.6rem] border border-white/10 bg-[rgba(11,19,32,0.84)] shadow-[0_24px_60px_rgba(2,6,23,0.28)] backdrop-blur"
                  >
                    {entry.imageUrl ? (
                      <div className="overflow-hidden border-b border-white/8">
                        <Image
                          src={entry.imageUrl}
                          alt={entry.name}
                          width={480}
                          height={270}
                          loading={index === 0 ? "eager" : "lazy"}
                          priority={index === 0}
                          className="h-48 w-full object-cover transition duration-500 hover:scale-[1.03]"
                        />
                      </div>
                    ) : null}
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-semibold text-white">{entry.name}</h3>
                          <p className="mt-1 text-xs uppercase tracking-[0.18em] text-white/42">{entry.category}</p>
                        </div>
                        <span className="rounded-full border border-[var(--accent)]/25 bg-[var(--accent)]/10 px-3 py-1 text-xs font-semibold text-[var(--cream)]">
                          {formatGBP(entry.pricePence)}
                        </span>
                      </div>

                      <p className="mt-4 text-sm leading-7 text-white/68">{entry.description}</p>
                      {entry.modifierGroups && entry.modifierGroups.length > 0 ? (
                        <p className="mt-2 text-xs text-white/45">
                          Customisable · {entry.modifierGroups.length} option group{entry.modifierGroups.length === 1 ? "" : "s"}
                        </p>
                      ) : null}
                      <p className="mt-4 text-xs font-medium uppercase tracking-[0.18em] text-white/45">
                        Available now: {entry.stockQuantity}
                      </p>

                      <div className="mt-5 flex items-center gap-3">
                        {/* +/- only available for plain (no-modifier) entries */}
                        {!entry.modifierGroups?.length && (
                          <>
                            <button
                              type="button"
                              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/12 bg-white/6 text-lg text-white transition hover:bg-white/10"
                              onClick={() => updateQuantity(entry.id, simpleQty - 1)}
                            >
                              -
                            </button>
                            <span className="min-w-10 text-center text-base font-semibold text-white">{simpleQty}</span>
                            <button
                              type="button"
                              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/12 bg-white/6 text-lg text-white transition hover:bg-white/10"
                              onClick={() => updateQuantity(entry.id, simpleQty + 1)}
                            >
                              +
                            </button>
                          </>
                        )}

                        <button
                          type="button"
                          className="ml-auto rounded-full bg-[var(--accent-strong)] px-4 py-2 text-sm font-semibold text-white shadow-[0_16px_35px_rgba(240,90,40,0.22)] transition hover:-translate-y-0.5 hover:brightness-105"
                          onClick={() => handleAddToBasket(entry)}
                        >
                          {entry.modifierGroups?.length
                            ? totalQty > 0
                              ? `Customise & add more (${totalQty})`
                              : "Customise & add"
                            : totalQty > 0
                              ? `Add more (${totalQty})`
                              : "Add to basket"}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        ))}
      </section>

      <aside className="surface-panel h-fit rounded-[1.8rem] p-5 lg:sticky lg:top-24">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/42">Basket summary</p>
        <h2 className="mt-2 text-2xl font-semibold text-white">Your Basket</h2>
        <p className="mt-2 text-sm leading-7 text-white/62">
          Review items and continue into the full cart and checkout flow.
        </p>

        <div className="mt-4 space-y-3">
          {cartItems.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-white/12 bg-white/4 p-4 text-sm text-white/60">
              No items selected yet.
            </p>
          ) : (
            cartItems.map((entry) => (
              <div key={entry.cartKey} className="rounded-2xl border border-white/8 bg-white/4 p-4 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-white">{entry.quantity} × {entry.name}</p>
                    <p className="text-white/48">{formatGBP(entry.effectivePricePence)} each</p>
                  </div>
                  <span className="font-medium text-white">{formatGBP(entry.effectivePricePence * entry.quantity)}</span>
                </div>
                {entry.selectedModifiers && entry.selectedModifiers.length > 0 && (
                  <ul className="mt-2 space-y-0.5 border-t border-white/8 pt-2">
                    {entry.selectedModifiers.map((mod) => (
                      <li key={mod.modifierId} className="text-xs text-white/50">
                        {mod.groupName}: {mod.modifierName}
                        {mod.priceDeltaPence !== 0 && (
                          <span className="ml-1">({mod.priceDeltaPence > 0 ? "+" : ""}{formatGBP(mod.priceDeltaPence)})</span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))
          )}
        </div>

        <div className="mt-4 border-t border-white/10 pt-4">
          <div className="flex items-center justify-between text-base font-semibold text-white">
            <span>Total</span>
            <span>{formatGBP(subtotalPence)}</span>
          </div>
          <p className="mt-2 text-xs uppercase tracking-[0.18em] text-white/42">{totalItems} item{totalItems === 1 ? "" : "s"} ready for checkout.</p>
        </div>

        <div className="mt-5 space-y-3">
          <Link href="/cart" className="block w-full rounded-full border border-white/12 bg-white/6 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-white/10">
            Open cart
          </Link>
          <Link href="/checkout" className="block w-full rounded-full bg-[var(--accent-strong)] px-4 py-3 text-center text-sm font-semibold text-white shadow-[0_20px_45px_rgba(240,90,40,0.24)] transition hover:-translate-y-0.5 hover:brightness-105">
            Proceed to checkout
          </Link>
        </div>
      </aside>
    </div>
  );
}
