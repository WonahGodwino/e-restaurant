"use client";

import { useMemo, useState } from "react";
import type { MenuItem } from "@/types";
import { formatGBP } from "@/lib/currency";

type Props = {
  items: MenuItem[];
};

type CartState = Record<string, number>;

export default function MenuOrderClient({ items }: Props) {
  const [cart, setCart] = useState<CartState>({});
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const cartItems = useMemo(() => {
    return items
      .map((item) => ({ item, quantity: cart[item.id] ?? 0 }))
      .filter((entry) => entry.quantity > 0);
  }, [items, cart]);

  const totalPence = useMemo(
    () => cartItems.reduce((sum, entry) => sum + entry.item.pricePence * entry.quantity, 0),
    [cartItems],
  );

  function updateQuantity(itemId: string, delta: number) {
    setCart((prev) => {
      const next = { ...prev };
      const current = next[itemId] ?? 0;
      const updated = Math.max(0, current + delta);
      if (updated === 0) {
        delete next[itemId];
      } else {
        next[itemId] = updated;
      }
      return next;
    });
  }

  async function checkout() {
    setError(null);

    if (!cartItems.length) {
      setError("Add at least one item to your basket.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          customerEmail,
          customerPhone,
          deliveryAddress,
          notes,
          items: cartItems.map((entry) => ({
            foodItemId: entry.item.id,
            quantity: entry.quantity,
          })),
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        setError(payload.error ?? "Could not start checkout.");
        return;
      }

      window.location.href = payload.checkoutUrl;
    } catch {
      setError("Checkout failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
      <section className="space-y-10">
        {Object.entries(grouped).map(([category, entries]) => (
          <div key={category} className="space-y-4">
            <h2 className="text-2xl font-semibold text-slate-900">{category}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {entries.map((entry) => (
                <article key={entry.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <h3 className="text-lg font-semibold text-slate-900">{entry.name}</h3>
                  <p className="mt-2 text-sm text-slate-600">{entry.description}</p>
                  <p className="mt-3 text-base font-semibold text-slate-900">{formatGBP(entry.pricePence)}</p>
                  <div className="mt-4 flex items-center gap-3">
                    <button
                      type="button"
                      className="h-9 w-9 rounded-full border border-slate-300 text-lg"
                      onClick={() => updateQuantity(entry.id, -1)}
                    >
                      -
                    </button>
                    <span className="min-w-8 text-center font-medium">{cart[entry.id] ?? 0}</span>
                    <button
                      type="button"
                      className="h-9 w-9 rounded-full border border-slate-300 text-lg"
                      onClick={() => updateQuantity(entry.id, 1)}
                    >
                      +
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        ))}
      </section>

      <aside className="h-fit rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm lg:sticky lg:top-6">
        <h2 className="text-xl font-semibold text-slate-900">Your Basket</h2>

        <div className="mt-4 space-y-3">
          {cartItems.length === 0 ? (
            <p className="text-sm text-slate-600">No items selected yet.</p>
          ) : (
            cartItems.map((entry) => (
              <div key={entry.item.id} className="flex items-start justify-between gap-2 text-sm">
                <div>
                  <p className="font-medium text-slate-900">
                    {entry.quantity} x {entry.item.name}
                  </p>
                  <p className="text-slate-500">{formatGBP(entry.item.pricePence)} each</p>
                </div>
                <span className="font-medium text-slate-900">
                  {formatGBP(entry.item.pricePence * entry.quantity)}
                </span>
              </div>
            ))
          )}
        </div>

        <div className="mt-4 border-t border-slate-200 pt-4">
          <div className="flex items-center justify-between text-base font-semibold text-slate-900">
            <span>Total</span>
            <span>{formatGBP(totalPence)}</span>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          <input
            value={customerName}
            onChange={(event) => setCustomerName(event.target.value)}
            placeholder="Full name"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          />
          <input
            value={customerEmail}
            onChange={(event) => setCustomerEmail(event.target.value)}
            placeholder="Email"
            type="email"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          />
          <input
            value={customerPhone}
            onChange={(event) => setCustomerPhone(event.target.value)}
            placeholder="Phone (optional)"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          />
          <textarea
            value={deliveryAddress}
            onChange={(event) => setDeliveryAddress(event.target.value)}
            placeholder="Delivery address"
            rows={3}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          />
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Order notes (optional)"
            rows={2}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          />
        </div>

        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

        <button
          type="button"
          disabled={submitting}
          onClick={checkout}
          className="mt-5 w-full rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
        >
          {submitting ? "Preparing checkout..." : "Pay securely with Shopify"}
        </button>
      </aside>
    </div>
  );
}
