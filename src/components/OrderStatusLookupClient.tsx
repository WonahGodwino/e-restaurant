"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { formatGBP } from "@/lib/currency";

type StatusHistoryEntry = {
  id: string;
  status: string;
  note: string | null;
  createdAt: string;
};

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
  deliveryAddress: string;
  notes: string | null;
  totalPence: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  statusHistory: StatusHistoryEntry[];
};

const ACTIVE_STATUSES = new Set([
  "PENDING_PAYMENT",
  "PAID",
  "RECEIVED",
  "PREPARING",
  "READY",
  "OUT_FOR_DELIVERY",
]);

const STATUS_STEPS = [
  { key: "RECEIVED", label: "Order received" },
  { key: "PREPARING", label: "Preparing" },
  { key: "READY", label: "Ready" },
  { key: "OUT_FOR_DELIVERY", label: "Out for delivery" },
  { key: "DELIVERED", label: "Delivered" },
];

const STATUS_LABEL: Record<string, string> = {
  PENDING_PAYMENT: "Pending payment",
  PAID: "Paid",
  FAILED: "Failed",
  CANCELLED: "Cancelled",
  RECEIVED: "Order received",
  PREPARING: "Preparing",
  READY: "Ready for collection / delivery",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered",
};

const POLL_INTERVAL_MS = 30_000;

export default function OrderStatusLookupClient() {
  const [orderId, setOrderId] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<OrderResult | null>(null);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const latestOrderIdRef = useRef("");
  const latestEmailRef = useRef("");

  function stopPolling() {
    if (pollRef.current !== null) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }

  async function fetchOrder(oid: string, em: string): Promise<OrderResult | null> {
    const params = new URLSearchParams({ orderId: oid.trim(), email: em.trim() });
    const response = await fetch(`/api/orders/status?${params.toString()}`);
    if (!response.ok) return null;
    const payload = await response.json();
    return payload.order as OrderResult;
  }

  async function lookupOrder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    stopPolling();
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

      const found = payload.order as OrderResult;
      setOrder(found);
      latestOrderIdRef.current = orderId.trim();
      latestEmailRef.current = email.trim();

      if (ACTIVE_STATUSES.has(found.status)) {
        pollRef.current = setInterval(async () => {
          const updated = await fetchOrder(
            latestOrderIdRef.current,
            latestEmailRef.current,
          );
          if (updated) {
            setOrder(updated);
            if (!ACTIVE_STATUSES.has(updated.status)) {
              stopPolling();
            }
          }
        }, POLL_INTERVAL_MS);
      }
    } catch {
      setError("Order lookup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => stopPolling, []);

  function getStepState(stepKey: string, status: string) {
    const stepIndex = STATUS_STEPS.findIndex((s) => s.key === stepKey);
    const currentIndex = STATUS_STEPS.findIndex((s) => s.key === status);
    if (currentIndex === -1) {
      return "pending";
    }
    if (stepIndex < currentIndex) return "done";
    if (stepIndex === currentIndex) return "active";
    return "pending";
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
        <section className="surface-panel rounded-[1.8rem] p-6 space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-white/45">Order</p>
              <h3 className="mt-2 font-mono text-white">{order.id}</h3>
            </div>
            <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-300">
              {STATUS_LABEL[order.status] ?? order.status.replaceAll("_", " ")}
            </span>
          </div>

          {STATUS_STEPS.findIndex((s) => s.key === order.status) >= 0 ? (
            <div>
              <p className="mb-3 text-xs uppercase tracking-[0.16em] text-white/45">Progress</p>
              <ol className="flex items-start gap-0">
                {STATUS_STEPS.map((step, idx) => {
                  const state = getStepState(step.key, order.status);
                  const prevDone =
                    idx === 0 ||
                    getStepState(STATUS_STEPS[idx - 1].key, order.status) === "done";
                  return (
                    <li key={step.key} className="flex flex-1 flex-col items-center">
                      <div className="flex w-full items-center">
                        {idx > 0 ? (
                          <div className={`h-0.5 flex-1 ${prevDone ? "bg-emerald-500/60" : "bg-white/15"}`} />
                        ) : null}
                        <span
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold
                            ${state === "done" ? "bg-emerald-500 text-white" : ""}
                            ${state === "active" ? "ring-2 ring-emerald-400 bg-emerald-500/30 text-emerald-300" : ""}
                            ${state === "pending" ? "bg-white/10 text-white/35" : ""}
                          `}
                        >
                          {state === "done" ? "✓" : idx + 1}
                        </span>
                        {idx < STATUS_STEPS.length - 1 ? (
                          <div className={`h-0.5 flex-1 ${state === "done" ? "bg-emerald-500/60" : "bg-white/15"}`} />
                        ) : null}
                      </div>
                      <span
                        className={`mt-1.5 text-center text-[10px] leading-tight ${state === "active" ? "text-emerald-300 font-semibold" : state === "done" ? "text-white/60" : "text-white/30"}`}
                      >
                        {step.label}
                      </span>
                    </li>
                  );
                })}
              </ol>
            </div>
          ) : null}

          <div className="space-y-3 text-sm text-white/68">
            <div className="flex items-center justify-between"><span>Customer</span><span>{order.customerName}</span></div>
            <div className="flex items-center justify-between"><span>Email</span><span>{order.customerEmail}</span></div>
            <div className="flex items-center justify-between"><span>Placed</span><span>{new Date(order.createdAt).toLocaleString("en-GB")}</span></div>
            <div className="flex items-center justify-between border-t border-white/10 pt-3 text-base font-semibold text-white">
              <span>Total</span>
              <span>{formatGBP(order.totalPence)}</span>
            </div>
          </div>

          <div className="space-y-3">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/4 p-4 text-sm">
                <span className="text-white/72">{item.itemName} ×{item.quantity}</span>
                <span className="font-medium text-white">{formatGBP(item.lineTotalPence)}</span>
              </div>
            ))}
          </div>

          {order.statusHistory && order.statusHistory.length > 0 ? (
            <div>
              <p className="mb-3 text-xs uppercase tracking-[0.16em] text-white/45">Timeline</p>
              <ol className="space-y-3 border-l border-white/15 pl-4">
                {order.statusHistory.map((entry) => (
                  <li key={entry.id} className="text-sm">
                    <span className="font-semibold text-white">
                      {STATUS_LABEL[entry.status] ?? entry.status.replaceAll("_", " ")}
                    </span>
                    <span className="ml-2 text-white/40 text-xs">
                      {new Date(entry.createdAt).toLocaleString("en-GB")}
                    </span>
                    {entry.note ? (
                      <p className="mt-0.5 text-white/55">{entry.note}</p>
                    ) : null}
                  </li>
                ))}
              </ol>
            </div>
          ) : null}

          {ACTIVE_STATUSES.has(order.status) ? (
            <p className="text-xs text-white/40">
              Status refreshes automatically every 30 seconds.
            </p>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <Link
              href={`/order-confirmation/${order.id}`}
              className="rounded-full border border-white/10 bg-white/6 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Open confirmation page
            </Link>
            <Link
              href="/contact"
              className="rounded-full border border-white/10 bg-white/6 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Contact support
            </Link>
          </div>
        </section>
      ) : null}
    </div>
  );
}
