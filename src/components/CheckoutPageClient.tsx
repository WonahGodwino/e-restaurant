"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useCart } from "@/components/CartProvider";
import { formatGBP } from "@/lib/currency";

const DELIVERY_PENCE = 399;

type FulfillmentType = "DELIVERY" | "PICKUP";

type DeliveryQuote = {
  serviceable: boolean;
  reason?: string;
  zoneName?: string;
  deliveryFeePence: number;
  minOrderPence: number;
  totalPence: number;
};

type FormState = {
  name: string;
  email: string;
  phone: string;
  fulfillmentType: FulfillmentType;
  deliveryPostcode: string;
  address: string;
  notes: string;
};

export default function CheckoutPageClient() {
  const { items, subtotalPence, clearCart } = useCart();
  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    phone: "",
    fulfillmentType: "DELIVERY",
    deliveryPostcode: "",
    address: "",
    notes: "",
  });
  const [deliveryQuote, setDeliveryQuote] = useState<DeliveryQuote | null>(null);
  const [quotingDelivery, setQuotingDelivery] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [ageConfirmed, setAgeConfirmed] = useState(false);

  const hasAgeRestrictedItems = useMemo(
    () => items.some((item) => item.isAgeRestricted),
    [items],
  );

  const deliveryFeePence = useMemo(() => {
    if (form.fulfillmentType === "PICKUP") {
      return 0;
    }

    return deliveryQuote?.deliveryFeePence ?? DELIVERY_PENCE;
  }, [deliveryQuote?.deliveryFeePence, form.fulfillmentType]);

  const totalPence = useMemo(() => subtotalPence + deliveryFeePence, [deliveryFeePence, subtotalPence]);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function fetchDeliveryQuote(postcodeInput: string): Promise<DeliveryQuote | null> {
    const postcode = postcodeInput.trim();

    if (!postcode || form.fulfillmentType !== "DELIVERY") {
      setDeliveryQuote(null);
      return null;
    }

    setQuotingDelivery(true);

    try {
      const response = await fetch("/api/delivery/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subtotalPence,
          postcode,
          fulfillmentType: form.fulfillmentType,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        setDeliveryQuote(null);
        return null;
      }

      const quote = payload as DeliveryQuote;
      setDeliveryQuote(quote);
      return quote;
    } catch {
      setDeliveryQuote(null);
      return null;
    } finally {
      setQuotingDelivery(false);
    }
  }

  async function placeOrder() {
    setError(null);

    if (items.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    if (!form.name.trim() || !form.email.trim()) {
      setError("Name and email are required.");
      return;
    }

    if (hasAgeRestrictedItems && !ageConfirmed) {
      setError("You must confirm you are aged 18 or over to purchase age-restricted items.");
      return;
    }

    if (form.fulfillmentType === "DELIVERY" && !form.address.trim()) {
      setError("Delivery address is required for delivery orders.");
      return;
    }

    if (form.fulfillmentType === "DELIVERY" && !form.deliveryPostcode.trim()) {
      setError("Delivery postcode is required for delivery orders.");
      return;
    }

    if (form.fulfillmentType === "DELIVERY") {
      const quote = await fetchDeliveryQuote(form.deliveryPostcode);
      if (!quote || !quote.serviceable) {
        setError(quote?.reason ?? "Delivery is not available for this postcode.");
        return;
      }
    }
    setSubmitting(true);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: form.name,
          customerEmail: form.email,
          customerPhone: form.phone,
          fulfillmentType: form.fulfillmentType,
          deliveryPostcode: form.deliveryPostcode,
          deliveryAddress: form.address,
          notes: form.notes,
          items: items.map((item) => ({
            foodItemId: item.id,
            quantity: item.quantity,
            selectedModifiers: item.selectedModifiers ?? [],
          })),
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        setError(payload.error ?? "Could not place order.");
        return;
      }

      clearCart();
      window.location.assign(payload.checkoutUrl);
    } catch {
      setError("Checkout failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8 max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--cream)]/70">Complete your order</p>
        <h1 className="font-heading mt-3 text-4xl text-white">Checkout</h1>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.3fr_0.92fr]">
        <section className="surface-panel rounded-[1.8rem] p-6">
          <h2 className="text-2xl font-semibold text-white">Fulfilment information</h2>
          <p className="mt-3 text-sm leading-7 text-white/62">
            Before placing your order, review the delivery, refund, and allergy policies that apply to online fulfilment.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => {
                updateField("fulfillmentType", "DELIVERY");
                void fetchDeliveryQuote(form.deliveryPostcode);
              }}
              className={[
                "rounded-2xl border px-4 py-3 text-sm font-semibold transition",
                form.fulfillmentType === "DELIVERY"
                  ? "border-[var(--accent-strong)] bg-[var(--accent-strong)]/20 text-white"
                  : "border-white/10 bg-white/6 text-white/72 hover:bg-white/10 hover:text-white",
              ].join(" ")}
            >
              Delivery
            </button>
            <button
              type="button"
              onClick={() => {
                updateField("fulfillmentType", "PICKUP");
                setDeliveryQuote(null);
              }}
              className={[
                "rounded-2xl border px-4 py-3 text-sm font-semibold transition",
                form.fulfillmentType === "PICKUP"
                  ? "border-[var(--accent-strong)] bg-[var(--accent-strong)]/20 text-white"
                  : "border-white/10 bg-white/6 text-white/72 hover:bg-white/10 hover:text-white",
              ].join(" ")}
            >
              Pickup
            </button>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <input value={form.name} onChange={(event) => updateField("name", event.target.value)} placeholder="Full name" className="w-full rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white placeholder:text-white/35 sm:col-span-2" />
            <input value={form.email} onChange={(event) => updateField("email", event.target.value)} placeholder="Email" type="email" className="w-full rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white placeholder:text-white/35" />
            <input value={form.phone} onChange={(event) => updateField("phone", event.target.value)} placeholder="Phone number" className="w-full rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white placeholder:text-white/35" />
            {form.fulfillmentType === "DELIVERY" ? (
              <>
                <input
                  value={form.deliveryPostcode}
                  onChange={(event) => {
                    updateField("deliveryPostcode", event.target.value);
                    setDeliveryQuote(null);
                  }}
                  onBlur={() => {
                    void fetchDeliveryQuote(form.deliveryPostcode);
                  }}
                  placeholder="Delivery postcode"
                  className="w-full rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white placeholder:text-white/35 sm:col-span-2"
                />

                {deliveryQuote ? (
                  <div className={`rounded-2xl border px-4 py-3 text-sm sm:col-span-2 ${deliveryQuote.serviceable ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-100" : "border-red-400/25 bg-red-500/10 text-red-200"}`}>
                    {deliveryQuote.serviceable
                      ? `Delivery zone: ${deliveryQuote.zoneName || "Matched"}. Fee ${formatGBP(deliveryQuote.deliveryFeePence)}.`
                      : deliveryQuote.reason || "Delivery unavailable for this postcode."}
                  </div>
                ) : quotingDelivery ? (
                  <div className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white/70 sm:col-span-2">
                    Checking delivery options...
                  </div>
                ) : null}

                <textarea value={form.address} onChange={(event) => updateField("address", event.target.value)} placeholder="Delivery address" rows={4} className="w-full rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white placeholder:text-white/35 sm:col-span-2" />
              </>
            ) : (
              <div className="rounded-2xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100 sm:col-span-2">
                Pickup selected: no delivery address required.
              </div>
            )}
            <textarea value={form.notes} onChange={(event) => updateField("notes", event.target.value)} placeholder="Order notes" rows={3} className="w-full rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white placeholder:text-white/35 sm:col-span-2" />
          </div>

          {hasAgeRestrictedItems ? (
            <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-amber-400/30 bg-amber-500/12 p-4 text-sm text-amber-200">
              <input
                type="checkbox"
                checked={ageConfirmed}
                onChange={(event) => setAgeConfirmed(event.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-amber-400"
              />
              <span>
                <strong className="font-semibold">Age verification required</strong> — your order contains age-restricted items
                (e.g. alcohol). By checking this box you confirm that you are aged 18 or over and that proof of age
                may be requested on delivery.
              </span>
            </label>
          ) : null}

          {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}

          <div className="mt-6 grid gap-3 rounded-[1.5rem] border border-white/8 bg-white/4 p-4 text-sm text-white/66 sm:grid-cols-3">
            <Link href="/delivery-policy" className="transition hover:text-white">
              Delivery policy
            </Link>
            <Link href="/refund-policy" className="transition hover:text-white">
              Refund policy
            </Link>
            <Link href="/allergy-disclaimer" className="transition hover:text-white">
              Allergy disclaimer
            </Link>
          </div>

          <p className="mt-4 text-xs leading-6 text-white/50">
            Legal notice: placing an order confirms you have reviewed menu suitability, allergy guidance,
            and fulfilment conditions, and agree to our checkout terms.
          </p>

          <button type="button" disabled={submitting} onClick={placeOrder} className="mt-6 rounded-full bg-[var(--accent-strong)] px-6 py-3 text-sm font-semibold text-white shadow-[0_16px_35px_rgba(240,90,40,0.22)] disabled:opacity-60">
            {submitting ? "Preparing checkout..." : "Place order"}
          </button>
        </section>

        <aside className="surface-panel h-fit rounded-[1.8rem] p-5 lg:sticky lg:top-24">
          <h2 className="text-2xl font-semibold text-white">Order Summary</h2>
          <div className="mt-5 space-y-4">
            {items.length === 0 ? (
              <p className="text-sm text-white/60">No items in cart.</p>
            ) : (
              items.map((item) => (
                <div key={item.id} className="flex items-start justify-between gap-3 rounded-2xl border border-white/8 bg-white/4 p-4 text-sm">
                  <div>
                    <p className="font-medium text-white">{item.name}</p>
                    <p className="text-white/48">x{item.quantity}</p>
                  </div>
                  <span className="font-medium text-white">{formatGBP(item.pricePence * item.quantity)}</span>
                </div>
              ))
            )}
          </div>

          <div className="mt-6 space-y-3 text-sm text-white/68">
            <div className="flex items-center justify-between"><span>Subtotal</span><span>{formatGBP(subtotalPence)}</span></div>
            <div className="flex items-center justify-between"><span>{form.fulfillmentType === "DELIVERY" ? "Delivery" : "Pickup"}</span><span>{formatGBP(deliveryFeePence)}</span></div>
            <div className="flex items-center justify-between border-t border-white/10 pt-3 text-base font-semibold text-white"><span>Total</span><span>{formatGBP(totalPence)}</span></div>
          </div>

          <p className="mt-5 text-xs uppercase tracking-[0.18em] text-white/42">
            By placing an order, you agree to the terms, privacy, and fulfilment policies published on this site.
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium text-white/66">
            <Link href="/terms-and-conditions" className="rounded-full border border-white/10 bg-white/6 px-3 py-1 transition hover:bg-white/10 hover:text-white">Terms and conditions</Link>
            <Link href="/privacy-policy" className="rounded-full border border-white/10 bg-white/6 px-3 py-1 transition hover:bg-white/10 hover:text-white">Privacy policy</Link>
          </div>
        </aside>
      </div>
    </div>
  );
}