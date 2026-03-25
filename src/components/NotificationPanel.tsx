"use client";

import { useEffect, useState } from 'react';
import type { MenuItem } from '@/types';

interface LowStockItem {
  id: string;
  name: string;
  currentStock: number;
  threshold: number;
}

export default function NotificationPanel({ adminKey }: { adminKey: string }) {
  const [thresholds, setThresholds] = useState<Record<string, string>>({});
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
  const [checkingStock, setCheckingStock] = useState(false);

  // Load items to display thresholds
  useEffect(() => {
    if (!adminKey) return;

    setLoading(true);
    fetch('/api/admin/menu', {
      headers: { 'x-admin-key': adminKey },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.items) {
          setItems(data.items);
          // Initialize threshold inputs with current values
          const initialThresholds: Record<string, string> = {};
          data.items.forEach((item: MenuItem) => {
            initialThresholds[item.id] = String(item.lowStockThreshold || 5);
          });
          setThresholds(initialThresholds);
        }
      })
      .catch((err) => {
        setError('Failed to load items: ' + String(err));
      })
      .finally(() => setLoading(false));
  }, [adminKey]);

  async function updateThreshold(itemId: string) {
    const value = thresholds[itemId];
    if (!value) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/menu/${itemId}/threshold`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey,
        },
        body: JSON.stringify({
          lowStockThreshold: parseInt(value),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to update threshold');
        return;
      }

      setSuccess(`Updated ${data.name} threshold to ${value}`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to update: ' + String(err));
    } finally {
      setLoading(false);
    }
  }

  async function checkLowStock() {
    setCheckingStock(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/notifications/check-low-stock', {
        headers: { 'x-admin-key': adminKey },
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to check stock');
        return;
      }

      if (data.items && data.items.length > 0) {
        setLowStockItems(data.items);
        setSuccess(`Found ${data.items.length} low stock item(s)`);
      } else {
        setLowStockItems([]);
        setSuccess('All items have sufficient stock');
      }
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to check stock: ' + String(err));
    } finally {
      setCheckingStock(false);
    }
  }

  if (!adminKey) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm text-slate-600">
          Please enter your admin key above to manage notifications.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Low Stock Thresholds */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Low Stock Thresholds</h2>
          <button
            onClick={checkLowStock}
            disabled={checkingStock}
            className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {checkingStock ? 'Checking...' : 'Check Now'}
          </button>
        </div>

        {error && <div className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        {success && <div className="mb-3 rounded-lg bg-green-50 p-3 text-sm text-green-700">{success}</div>}

        {loading ? (
          <p className="text-sm text-slate-600">Loading items...</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-slate-600">No items to manage</p>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-3 rounded-lg border border-slate-200 p-3">
                <div className="flex-1">
                  <p className="font-semibold text-slate-900">{item.name}</p>
                  <p className="text-xs text-slate-600">Current stock: {item.stockQuantity}</p>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-slate-700">Threshold:</label>
                  <input
                    type="number"
                    min="1"
                    max="100000"
                    value={thresholds[item.id] || '5'}
                    onChange={(e) =>
                      setThresholds({
                        ...thresholds,
                        [item.id]: e.target.value,
                      })
                    }
                    className="w-20 rounded-lg border border-slate-300 px-2 py-1 text-sm"
                  />
                  <button
                    onClick={() => updateThreshold(item.id)}
                    disabled={loading}
                    className="rounded-lg bg-slate-900 px-3 py-1 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    Save
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {lowStockItems.length > 0 && (
          <div className="mt-4 rounded-lg border border-orange-200 bg-orange-50 p-4">
            <h3 className="font-semibold text-orange-900">⚠️ Low Stock Items</h3>
            <ul className="mt-2 space-y-1">
              {lowStockItems.map((item) => (
                <li key={item.id} className="text-sm text-orange-800">
                  <strong>{item.name}</strong> - {item.currentStock} remaining (threshold: {item.threshold})
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}
