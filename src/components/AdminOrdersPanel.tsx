"use client";

import { useEffect, useState } from "react";
import { formatGBP } from "@/lib/currency";

type OrderItemModifier = {
  id: string;
  modifierId: string;
  modifierName: string;
  groupName: string;
  priceDeltaPence: number;
};

type OrderItem = {
  id: string;
  itemName: string;
  quantity: number;
  unitPricePence: number;
  lineTotalPence: number;
  modifiers: OrderItemModifier[];
};

type Order = {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  deliveryAddress: string;
  notes: string | null;
  totalPence: number;
  status: string;
  createdAt: string;
  items: OrderItem[];
};

type Props = {
  adminKey: string;
};

export default function AdminOrdersPanel({ adminKey }: Props) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());

  async function loadOrders() {
    if (!adminKey) return;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/orders", {
        headers: { "x-admin-key": adminKey },
      });
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error ?? "Could not load orders.");
        return;
      }
      setOrders(payload.orders);
    } catch {
      setError("Failed to load orders.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadOrders();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminKey]);

  function toggleOrder(orderId: string) {
    setExpandedOrders((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) {
        next.delete(orderId);
      } else {
        next.add(orderId);
      }
      return next;
    });
  }

  const STATUS_LABELS: Record<string, string> = {
    PENDING_PAYMENT: "Pending Payment",
    PAID: "Paid",
    FAILED: "Failed",
    CANCELLED: "Cancelled",
  };

  const STATUS_COLORS: Record<string, string> = {
    PENDING_PAYMENT: "bg-amber-100 text-amber-800",
    PAID: "bg-emerald-100 text-emerald-800",
    FAILED: "bg-red-100 text-red-800",
    CANCELLED: "bg-slate-100 text-slate-700",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Orders</h2>
        <button
          type="button"
          onClick={() => void loadOrders()}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Loading orders…</p>
      ) : error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : orders.length === 0 ? (
        <p className="text-sm text-slate-600">No orders yet.</p>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const expanded = expandedOrders.has(order.id);
            return (
              <div key={order.id} className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                {/* Summary row */}
                <button
                  type="button"
                  onClick={() => toggleOrder(order.id)}
                  className="flex w-full flex-wrap items-start justify-between gap-3 p-4 text-left"
                >
                  <div>
                    <p className="font-mono text-xs text-slate-400">#{order.id.slice(-8)}</p>
                    <p className="mt-0.5 font-semibold text-slate-900">{order.customerName}</p>
                    <p className="text-xs text-slate-500">{order.customerEmail}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {new Date(order.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                        STATUS_COLORS[order.status] ?? "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {STATUS_LABELS[order.status] ?? order.status}
                    </span>
                    <span className="text-base font-bold text-slate-900">
                      {formatGBP(order.totalPence)}
                    </span>
                    <span className="text-xs text-slate-400">{expanded ? "▲ Hide" : "▼ Details"}</span>
                  </div>
                </button>

                {/* Expanded details */}
                {expanded && (
                  <div className="border-t border-slate-100 p-4">
                    <div className="mb-4 grid gap-2 text-sm sm:grid-cols-2">
                      <div>
                        <span className="text-slate-500">Delivery: </span>
                        <span className="text-slate-800">{order.deliveryAddress}</span>
                      </div>
                      {order.customerPhone && (
                        <div>
                          <span className="text-slate-500">Phone: </span>
                          <span className="text-slate-800">{order.customerPhone}</span>
                        </div>
                      )}
                      {order.notes && (
                        <div className="sm:col-span-2">
                          <span className="text-slate-500">Notes: </span>
                          <span className="text-slate-800">{order.notes}</span>
                        </div>
                      )}
                    </div>

                    <h3 className="mb-3 text-sm font-semibold text-slate-700">Items</h3>
                    <div className="space-y-3">
                      {order.items.map((item) => (
                        <div
                          key={item.id}
                          className="rounded-xl border border-slate-100 bg-slate-50 p-3"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-medium text-slate-900">{item.itemName}</p>
                              <p className="text-xs text-slate-500">
                                {item.quantity} × {formatGBP(item.unitPricePence)}
                              </p>
                            </div>
                            <span className="font-semibold text-slate-800">
                              {formatGBP(item.lineTotalPence)}
                            </span>
                          </div>

                          {/* Display chosen modifiers */}
                          {item.modifiers && item.modifiers.length > 0 && (
                            <div className="mt-2 space-y-1 border-t border-slate-200 pt-2">
                              {item.modifiers.map((mod) => (
                                <div
                                  key={mod.id}
                                  className="flex items-center justify-between text-xs text-slate-600"
                                >
                                  <span>
                                    <span className="font-medium text-slate-500">{mod.groupName}:</span>{" "}
                                    {mod.modifierName}
                                  </span>
                                  {mod.priceDeltaPence !== 0 && (
                                    <span
                                      className={
                                        mod.priceDeltaPence > 0
                                          ? "font-medium text-slate-700"
                                          : "font-medium text-emerald-600"
                                      }
                                    >
                                      {mod.priceDeltaPence > 0 ? "+" : ""}
                                      {formatGBP(mod.priceDeltaPence)}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
