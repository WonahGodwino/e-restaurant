"use client";

import { useEffect, useState, useCallback } from "react";
import { formatGBP } from "@/lib/currency";

type OrderStatus =
  | "PENDING_PAYMENT"
  | "PAID"
  | "FAILED"
  | "CANCELLED"
  | "RECEIVED"
  | "PREPARING"
  | "READY"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED";

type StatusHistoryEntry = {
  id: string;
  status: OrderStatus;
  note: string | null;
  createdAt: string;
};

type OrderItem = {
  id: string;
  itemName: string;
  quantity: number;
  lineTotalPence: number;
};

type Order = {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  deliveryAddress: string;
  notes: string | null;
  totalPence: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  statusHistory: StatusHistoryEntry[];
};

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "Pending Payment",
  PAID: "Paid",
  FAILED: "Failed",
  CANCELLED: "Cancelled",
  RECEIVED: "Received",
  PREPARING: "Preparing",
  READY: "Ready",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED: "Delivered",
};

const STATUS_COLOURS: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "bg-yellow-100 text-yellow-800",
  PAID: "bg-green-100 text-green-800",
  FAILED: "bg-red-100 text-red-800",
  CANCELLED: "bg-slate-100 text-slate-600",
  RECEIVED: "bg-blue-100 text-blue-800",
  PREPARING: "bg-orange-100 text-orange-800",
  READY: "bg-emerald-100 text-emerald-800",
  OUT_FOR_DELIVERY: "bg-purple-100 text-purple-800",
  DELIVERED: "bg-teal-100 text-teal-800",
};

const ALL_STATUSES: OrderStatus[] = [
  "PENDING_PAYMENT",
  "PAID",
  "FAILED",
  "CANCELLED",
  "RECEIVED",
  "PREPARING",
  "READY",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
];

export default function OrdersPanel({ adminKey }: { adminKey: string }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [updateStatus, setUpdateStatus] = useState<Record<string, OrderStatus>>({});
  const [updateNote, setUpdateNote] = useState<Record<string, string>>({});
  const [updateError, setUpdateError] = useState<Record<string, string>>({});
  const [updateSuccess, setUpdateSuccess] = useState<Record<string, boolean>>({});

  const limit = 20;

  const fetchOrders = useCallback(async () => {
    if (!adminKey) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (filterStatus) params.set("status", filterStatus);
      const res = await fetch(`/api/admin/orders?${params}`, {
        headers: { "x-admin-key": adminKey },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to load orders");
        return;
      }
      const data = await res.json();
      setOrders(data.orders ?? []);
      setTotal(data.total ?? 0);
    } catch {
      setError("Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, [adminKey, page, filterStatus]);

  useEffect(() => {
    void fetchOrders();
    const interval = setInterval(() => {
      void fetchOrders();
    }, 30_000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  async function handleStatusUpdate(orderId: string) {
    const newStatus = updateStatus[orderId];
    if (!newStatus) return;
    setUpdatingId(orderId);
    setUpdateError((prev) => ({ ...prev, [orderId]: "" }));
    setUpdateSuccess((prev) => ({ ...prev, [orderId]: false }));

    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": adminKey,
        },
        body: JSON.stringify({
          status: newStatus,
          note: updateNote[orderId]?.trim() || undefined,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setUpdateError((prev) => ({ ...prev, [orderId]: data.error ?? "Update failed" }));
        return;
      }

      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? (data.order as Order) : o)),
      );
      setUpdateNote((prev) => ({ ...prev, [orderId]: "" }));
      setUpdateSuccess((prev) => ({ ...prev, [orderId]: true }));
      setTimeout(() => setUpdateSuccess((prev) => ({ ...prev, [orderId]: false })), 3000);
    } catch {
      setUpdateError((prev) => ({ ...prev, [orderId]: "Network error" }));
    } finally {
      setUpdatingId(null);
    }
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm font-semibold text-slate-700">Filter by status:</label>
          <select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">All statuses</option>
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
          <button
            onClick={() => void fetchOrders()}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
          >
            Refresh
          </button>
          <span className="ml-auto text-sm text-slate-500">{total} order{total !== 1 ? "s" : ""}</span>
        </div>
      </div>

      {error ? (
        <p className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</p>
      ) : null}

      {loading && orders.length === 0 ? (
        <p className="text-sm text-slate-500">Loading orders…</p>
      ) : null}

      {/* Order list */}
      <div className="space-y-3">
        {orders.map((order) => {
          const isExpanded = expandedId === order.id;
          return (
            <div key={order.id} className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              {/* Summary row */}
              <button
                type="button"
                onClick={() => setExpandedId(isExpanded ? null : order.id)}
                className="w-full px-5 py-4 text-left flex flex-wrap items-center gap-3"
              >
                <span className="font-mono text-xs text-slate-500 shrink-0">{order.id}</span>
                <span className="font-semibold text-slate-900 truncate">{order.customerName}</span>
                <span className="text-sm text-slate-500 truncate">{order.customerEmail}</span>
                <span className={`ml-auto rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLOURS[order.status]}`}>
                  {STATUS_LABELS[order.status]}
                </span>
                <span className="text-sm font-semibold text-slate-800">{formatGBP(order.totalPence)}</span>
                <span className="text-xs text-slate-400">
                  {new Date(order.createdAt).toLocaleString("en-GB")}
                </span>
                <span className="text-slate-400">{isExpanded ? "▲" : "▼"}</span>
              </button>

              {/* Expanded detail */}
              {isExpanded ? (
                <div className="border-t border-slate-100 px-5 pb-5 pt-4 space-y-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    {/* Order items */}
                    <div>
                      <h3 className="text-sm font-semibold text-slate-700 mb-2">Items</h3>
                      <div className="space-y-1">
                        {order.items.map((item) => (
                          <div key={item.id} className="flex justify-between text-sm">
                            <span className="text-slate-700">{item.itemName} ×{item.quantity}</span>
                            <span className="text-slate-500">{formatGBP(item.lineTotalPence)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Delivery info */}
                    <div>
                      <h3 className="text-sm font-semibold text-slate-700 mb-2">Delivery</h3>
                      <p className="text-sm text-slate-600 whitespace-pre-line">{order.deliveryAddress}</p>
                      {order.customerPhone ? (
                        <p className="mt-1 text-sm text-slate-500">📞 {order.customerPhone}</p>
                      ) : null}
                      {order.notes ? (
                        <p className="mt-1 text-sm text-slate-500 italic">Note: {order.notes}</p>
                      ) : null}
                    </div>
                  </div>

                  {/* Status timeline */}
                  {order.statusHistory.length > 0 ? (
                    <div>
                      <h3 className="text-sm font-semibold text-slate-700 mb-2">Status Timeline</h3>
                      <ol className="relative border-l border-slate-200 space-y-3 pl-4">
                        {order.statusHistory.map((entry) => (
                          <li key={entry.id} className="text-sm">
                            <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_COLOURS[entry.status]}`}>
                              {STATUS_LABELS[entry.status]}
                            </span>
                            <span className="ml-2 text-slate-400 text-xs">
                              {new Date(entry.createdAt).toLocaleString("en-GB")}
                            </span>
                            {entry.note ? (
                              <p className="mt-0.5 text-slate-500">{entry.note}</p>
                            ) : null}
                          </li>
                        ))}
                      </ol>
                    </div>
                  ) : null}

                  {/* Update status */}
                  <div className="rounded-xl border border-slate-200 p-4 bg-slate-50">
                    <h3 className="text-sm font-semibold text-slate-700 mb-3">Update Order Status</h3>
                    <div className="flex flex-wrap gap-3 items-end">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">New status</label>
                        <select
                          value={updateStatus[order.id] ?? order.status}
                          onChange={(e) =>
                            setUpdateStatus((prev) => ({ ...prev, [order.id]: e.target.value as OrderStatus }))
                          }
                          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                        >
                          {ALL_STATUSES.map((s) => (
                            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex-1 min-w-[160px]">
                        <label className="block text-xs font-medium text-slate-600 mb-1">Note (optional)</label>
                        <input
                          type="text"
                          value={updateNote[order.id] ?? ""}
                          onChange={(e) =>
                            setUpdateNote((prev) => ({ ...prev, [order.id]: e.target.value }))
                          }
                          placeholder="e.g. Driver dispatched"
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                        />
                      </div>
                      <button
                        type="button"
                        disabled={updatingId === order.id}
                        onClick={() => void handleStatusUpdate(order.id)}
                        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                      >
                        {updatingId === order.id ? "Saving…" : "Save status"}
                      </button>
                    </div>
                    {updateError[order.id] ? (
                      <p className="mt-2 text-sm text-red-600">{updateError[order.id]}</p>
                    ) : null}
                    {updateSuccess[order.id] ? (
                      <p className="mt-2 text-sm text-green-600">Status updated successfully.</p>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 ? (
        <div className="flex items-center justify-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-sm text-slate-600">
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-40"
          >
            Next
          </button>
        </div>
      ) : null}
    </div>
  );
}
