"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useCart } from "@/components/CartProvider";
import { formatGBP } from "@/lib/currency";

const DELIVERY_PENCE = 399;

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

type OrderType = "ASAP" | "SCHEDULED";

type FormState = {
  name: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
};

export default function CheckoutPageClient() {
  const { items, subtotalPence, clearCart } = useCart();
  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    phone: "",
    address: "",
    notes: "",
  });
  const [orderType, setOrderType] = useState<OrderType>("ASAP");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [serviceType, setServiceType] = useState<"delivery" | "pickup">("delivery");
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const totalPence = useMemo(
    () => subtotalPence + (items.length > 0 ? DELIVERY_PENCE : 0),
    [items.length, subtotalPence],
  );

  // Build available date options: today + next 6 days
  const dateOptions = useMemo(() => {
    const options: { value: string; label: string }[] = [];
    const now = new Date();
    for (let i = 0; i < 7; i++) {
      // Use millisecond arithmetic to avoid month boundary issues with setDate
      const d = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      const value = `${yyyy}-${mm}-${dd}`;
      const dayName = i === 0 ? "Today" : i === 1 ? "Tomorrow" : DAY_NAMES[d.getDay()];
      options.push({ value, label: `${dayName} (${dd}/${mm})` });
    }
    return options;
  }, []);

  const fetchSlots = useCallback(
    async (date: string, type: "delivery" | "pickup") => {
      if (!date) return;
      setSlotsLoading(true);
      setSlotsError(null);
      setSelectedSlot("");
      try {
        const res = await fetch(`/api/slots?date=${date}&type=${type}`);
        const data = await res.json();
        if (!res.ok) {
          setSlotsError(data.error ?? "Could not load slots.");
          setAvailableSlots([]);
        } else {
          setAvailableSlots(data.slots ?? []);
          if (data.slots?.length === 0) {
            setSlotsError("No available slots for this day. Please choose another date.");
          }
        }
      } catch {
        setSlotsError("Could not load slots.");
        setAvailableSlots([]);
      } finally {
        setSlotsLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (orderType === "SCHEDULED" && selectedDate) {
      void fetchSlots(selectedDate, serviceType);
    }
  }, [orderType, selectedDate, serviceType, fetchSlots]);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function placeOrder() {
    setError(null);

    if (items.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    if (!form.name.trim() || !form.email.trim() || !form.address.trim()) {
      setError("Name, email, and delivery address are required.");
      return;
    }

    if (orderType === "SCHEDULED") {
      if (!selectedDate) {
        setError("Please select a date for your scheduled order.");
        return;
      }
      if (!selectedSlot) {
        setError("Please select a time slot for your scheduled order.");
        return;
      }
    }

    setSubmitting(true);

    // Build scheduledFor ISO string from date + slot
    let scheduledFor: string | undefined;
    if (orderType === "SCHEDULED" && selectedDate && selectedSlot) {
      scheduledFor = new Date(`${selectedDate}T${selectedSlot}:00`).toISOString();
    }

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: form.name,
          customerEmail: form.email,
          customerPhone: form.phone,
          deliveryAddress: form.address,
          notes: form.notes,
          orderType,
          scheduledFor,
          items: items.map((item) => ({
            foodItemId: item.id,
            quantity: item.quantity,
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
          <h2 className="text-2xl font-semibold text-white">Delivery information</h2>
          <p className="mt-3 text-sm leading-7 text-white/62">
            Before placing your order, review the delivery, refund, and allergy policies that apply to online fulfilment.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <input value={form.name} onChange={(event) => updateField("name", event.target.value)} placeholder="Full name" className="w-full rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white placeholder:text-white/35 sm:col-span-2" />
            <input value={form.email} onChange={(event) => updateField("email", event.target.value)} placeholder="Email" type="email" className="w-full rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white placeholder:text-white/35" />
            <input value={form.phone} onChange={(event) => updateField("phone", event.target.value)} placeholder="Phone number" className="w-full rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white placeholder:text-white/35" />
            <textarea value={form.address} onChange={(event) => updateField("address", event.target.value)} placeholder="Delivery address" rows={4} className="w-full rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white placeholder:text-white/35 sm:col-span-2" />
            <textarea value={form.notes} onChange={(event) => updateField("notes", event.target.value)} placeholder="Order notes" rows={3} className="w-full rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white placeholder:text-white/35 sm:col-span-2" />
          </div>

          {/* Order timing section */}
          <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-white/4 p-5">
            <h3 className="text-base font-semibold text-white">When would you like your order?</h3>

            {/* ASAP / Scheduled toggle */}
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={() => setOrderType("ASAP")}
                className={`flex-1 rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                  orderType === "ASAP"
                    ? "border-[var(--accent-strong)] bg-[var(--accent-strong)]/20 text-white"
                    : "border-white/10 bg-white/4 text-white/60 hover:text-white"
                }`}
              >
                🚀 ASAP
              </button>
              <button
                type="button"
                onClick={() => setOrderType("SCHEDULED")}
                className={`flex-1 rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                  orderType === "SCHEDULED"
                    ? "border-[var(--accent-strong)] bg-[var(--accent-strong)]/20 text-white"
                    : "border-white/10 bg-white/4 text-white/60 hover:text-white"
                }`}
              >
                📅 Schedule
              </button>
            </div>

            {orderType === "ASAP" && (
              <p className="mt-3 text-xs text-white/50">Your order will be prepared and dispatched as soon as possible.</p>
            )}

            {orderType === "SCHEDULED" && (
              <div className="mt-4 space-y-4">
                {/* Service type picker */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setServiceType("delivery")}
                    className={`flex-1 rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                      serviceType === "delivery"
                        ? "border-blue-400 bg-blue-400/20 text-white"
                        : "border-white/10 bg-white/4 text-white/60 hover:text-white"
                    }`}
                  >
                    🚚 Delivery
                  </button>
                  <button
                    type="button"
                    onClick={() => setServiceType("pickup")}
                    className={`flex-1 rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                      serviceType === "pickup"
                        ? "border-blue-400 bg-blue-400/20 text-white"
                        : "border-white/10 bg-white/4 text-white/60 hover:text-white"
                    }`}
                  >
                    🏃 Pickup
                  </button>
                </div>

                {/* Date picker */}
                <div>
                  <label className="block text-xs font-medium text-white/60 mb-1">Select date</label>
                  <select
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white"
                  >
                    <option value="">Choose a date…</option>
                    {dateOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Slot picker */}
                {selectedDate && (
                  <div>
                    <label className="block text-xs font-medium text-white/60 mb-1">Select time slot</label>
                    {slotsLoading ? (
                      <p className="text-xs text-white/50">Loading available slots…</p>
                    ) : slotsError ? (
                      <p className="text-xs text-red-300">{slotsError}</p>
                    ) : availableSlots.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {availableSlots.map((slot) => (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => setSelectedSlot(slot)}
                            className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                              selectedSlot === slot
                                ? "border-[var(--accent-strong)] bg-[var(--accent-strong)]/20 text-white"
                                : "border-white/10 bg-white/4 text-white/60 hover:text-white"
                            }`}
                          >
                            {slot}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                )}

                {selectedDate && selectedSlot && (
                  <p className="text-xs font-medium text-emerald-300">
                    ✓ Scheduled for {selectedDate} at {selectedSlot}
                  </p>
                )}
              </div>
            )}
          </div>

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
            <div className="flex items-center justify-between"><span>Delivery</span><span>{formatGBP(DELIVERY_PENCE)}</span></div>
            <div className="flex items-center justify-between border-t border-white/10 pt-3 text-base font-semibold text-white"><span>Total</span><span>{formatGBP(totalPence)}</span></div>
          </div>

          {orderType === "SCHEDULED" && selectedDate && selectedSlot && (
            <div className="mt-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300">
              <span className="font-semibold">Scheduled {serviceType}:</span>{" "}
              {selectedDate} at {selectedSlot}
            </div>
          )}

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
