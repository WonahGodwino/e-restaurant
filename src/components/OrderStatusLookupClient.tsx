"use client";

import { useState } from "react";
import Link from "next/link";
import { formatGBP } from "@/lib/currency";

type OrderItem = {
  id: string;
  itemName: string;
  quantity: number;
  lineTotalPence: number;
};

type OrderResult = {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  fulfillmentType: "DELIVERY" | "PICKUP";
  deliveryPostcode: string | null;
  deliveryZoneName: string | null;
  deliveryAddress: string | null;
  deliveryFeePence: number;
  notes: string | null;
  totalPence: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
};

export default function OrderStatusLookupClient() {
  const [orderId, setOrderId] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<OrderResult | null>(null);

  async function lookupOrder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setOrder(null);

    try {
      const params = new URLSearchParams({
        orderId: orderId.trim(),
        email: email.trim(),
      });

      const response = await fetch(`/api/orders/status?${params.toString()}`);
      const payload = await response.json();

      if (!response.ok) {
        setError(payload.error ?? "Could not find order.");
        return;
      }

      setOrder(payload.order as OrderResult);
    } catch {
      setError("Order lookup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <form onSubmit={lookupOrder} className="surface-panel rounded-[1.8rem] p-6">
        <h2 className="text-2xl font-semibold text-white">Find your order</h2>
        <p className="mt-3 text-sm leading-7 text-white/64">
          Enter your order ID and the email used at checkout to view the latest status.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label>
            <span className="mb-2 block text-sm font-medium text-white/74">Order ID</span>
            <input
              value={orderId}
              onChange={(event) => setOrderId(event.target.value)}
              placeholder="e.g. cmn638mlo0000nrf8q08nlg9m"
              className="w-full rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white placeholder:text-white/35"
            />
          </label>

          <label>
            <span className="mb-2 block text-sm font-medium text-white/74">Email</span>
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              type="email"
              className="w-full rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white placeholder:text-white/35"
            />
          </label>
        </div>

        {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}

        <button
          type="submit"
          disabled={loading}
          className="mt-6 rounded-full bg-[var(--accent-strong)] px-6 py-3 text-sm font-semibold text-white shadow-[0_16px_35px_rgba(240,90,40,0.22)] disabled:opacity-60"
        >
          {loading ? "Checking status..." : "Check order status"}
        </button>
      </form>

      {order ? (
        <section className="surface-panel rounded-[1.8rem] p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-white/45">Order</p>
              <h3 className="mt-2 font-mono text-white">{order.id}</h3>
            </div>
            <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-300">
              {order.status.replaceAll("_", " ")}
            </span>
          </div>

          <div className="mt-6 space-y-3 text-sm text-white/68">
            <div className="flex items-center justify-between"><span>Customer</span><span>{order.customerName}</span></div>
            <div className="flex items-center justify-between"><span>Email</span><span>{order.customerEmail}</span></div>
            <div className="flex items-center justify-between"><span>Fulfilment</span><span>{order.fulfillmentType === "DELIVERY" ? "Delivery" : "Pickup"}</span></div>
            {order.deliveryZoneName ? (
              <div className="flex items-center justify-between"><span>Zone</span><span>{order.deliveryZoneName}</span></div>
            ) : null}
            {order.deliveryPostcode ? (
              <div className="flex items-center justify-between"><span>Postcode</span><span>{order.deliveryPostcode}</span></div>
            ) : null}
            <div className="flex items-center justify-between"><span>Created</span><span>{new Date(order.createdAt).toLocaleString("en-GB")}</span></div>
            {order.deliveryFeePence > 0 ? (
              <div className="flex items-center justify-between"><span>Delivery fee</span><span>{formatGBP(order.deliveryFeePence)}</span></div>
            ) : null}
            <div className="flex items-center justify-between border-t border-white/10 pt-3 text-base font-semibold text-white"><span>Total</span><span>{formatGBP(order.totalPence)}</span></div>
          </div>

          <div className="mt-6 space-y-3">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/4 p-4 text-sm">
                <span className="text-white/72">{item.itemName} x{item.quantity}</span>
                <span className="font-medium text-white">{formatGBP(item.lineTotalPence)}</span>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link href={`/order-confirmation/${order.id}`} className="rounded-full border border-white/10 bg-white/6 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10">
              Open confirmation page
            </Link>
            <Link href="/contact" className="rounded-full border border-white/10 bg-white/6 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10">
              Contact support
            </Link>
          </div>
        </section>
      ) : null}
    </div>
  );
}