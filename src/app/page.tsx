"use client";

import { useEffect, useState } from "react";

interface MenuItem {
  id: number;
  name: string;
  description: string;
  category: string;
  priceGbp: number;
  imageUrl: string;
  available: boolean;
}

interface BasketItem {
  menuItem: MenuItem;
  quantity: number;
}

interface CheckoutForm {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryAddress: string;
}

function formatGbp(amount: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(amount);
}

const PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80";

export default function CustomerPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [basket, setBasket] = useState<BasketItem[]>([]);
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [showCheckout, setShowCheckout] = useState(false);
  const [form, setForm] = useState<CheckoutForm>({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    deliveryAddress: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderSuccess, setOrderSuccess] = useState<{
    orderId: number;
    totalGbp: number;
    checkoutUrl: string | null;
  } | null>(null);

  useEffect(() => {
    fetch("/api/menu")
      .then((r) => r.json())
      .then((data: MenuItem[]) => {
        setMenuItems(data);
        const q: Record<number, number> = {};
        data.forEach((item) => (q[item.id] = 1));
        setQuantities(q);
      })
      .catch(() => setError("Unable to load the menu. Please refresh the page."))
      .finally(() => setLoading(false));
  }, []);

  const categories = Array.from(new Set(menuItems.map((m) => m.category))).sort();

  function addToBasket(item: MenuItem) {
    const qty = quantities[item.id] ?? 1;
    setBasket((prev) => {
      const existing = prev.find((b) => b.menuItem.id === item.id);
      if (existing) {
        return prev.map((b) =>
          b.menuItem.id === item.id ? { ...b, quantity: b.quantity + qty } : b
        );
      }
      return [...prev, { menuItem: item, quantity: qty }];
    });
  }

  function removeFromBasket(itemId: number) {
    setBasket((prev) => prev.filter((b) => b.menuItem.id !== itemId));
  }

  function updateBasketQty(itemId: number, delta: number) {
    setBasket((prev) =>
      prev
        .map((b) =>
          b.menuItem.id === itemId
            ? { ...b, quantity: Math.max(1, b.quantity + delta) }
            : b
        )
        .filter((b) => b.quantity > 0)
    );
  }

  const basketTotal = basket.reduce(
    (sum, b) => sum + b.menuItem.priceGbp * b.quantity,
    0
  );

  async function handlePlaceOrder(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          items: basket.map((b) => ({
            menuItemId: b.menuItem.id,
            quantity: b.quantity,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to place order.");
        return;
      }
      setOrderSuccess(data);
      setBasket([]);
      setShowCheckout(false);
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <span className="text-stone-500 text-lg animate-pulse">Loading menu…</span>
      </div>
    );
  }

  if (orderSuccess && !orderSuccess.checkoutUrl) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-2xl shadow p-8">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-stone-900 mb-2">Order Placed!</h2>
          <p className="text-stone-600 mb-2">
            Your order #{orderSuccess.orderId} has been received.
          </p>
          <p className="text-stone-600 mb-6">
            Total: <span className="font-semibold">{formatGbp(orderSuccess.totalGbp)}</span>
          </p>
          <button
            onClick={() => setOrderSuccess(null)}
            className="bg-amber-500 hover:bg-amber-600 text-white font-semibold px-6 py-2 rounded-lg transition-colors"
          >
            Order Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-stone-900">Our Menu</h1>
        <p className="text-stone-500 mt-1">
          Fresh, quality food – delivered to your door across the UK
        </p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {menuItems.length === 0 ? (
        <p className="text-stone-500 text-center py-16">
          No menu items available at the moment. Please check back soon.
        </p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Menu */}
          <div className="lg:col-span-2 space-y-10">
            {categories.map((category) => (
              <section key={category}>
                <h2 className="text-xl font-semibold text-stone-800 border-b border-stone-200 pb-2 mb-4">
                  {category}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {menuItems
                    .filter((m) => m.category === category)
                    .map((item) => (
                      <div
                        key={item.id}
                        className="bg-white rounded-xl shadow-sm border border-stone-100 overflow-hidden flex flex-col"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.imageUrl || PLACEHOLDER_IMAGE}
                          alt={item.name}
                          className="w-full h-44 object-cover"
                        />
                        <div className="p-4 flex flex-col flex-1">
                          <div className="flex justify-between items-start mb-1">
                            <h3 className="font-semibold text-stone-900">{item.name}</h3>
                            <span className="text-amber-600 font-bold ml-2 shrink-0">
                              {formatGbp(item.priceGbp)}
                            </span>
                          </div>
                          <p className="text-stone-500 text-sm flex-1 mb-3">
                            {item.description}
                          </p>
                          <div className="flex items-center gap-2 mt-auto">
                            <label htmlFor={`qty-${item.id}`} className="text-sm text-stone-600 shrink-0">
                              Qty:
                            </label>
                            <input
                              id={`qty-${item.id}`}
                              type="number"
                              min={1}
                              max={20}
                              value={quantities[item.id] ?? 1}
                              onChange={(e) =>
                                setQuantities((q) => ({
                                  ...q,
                                  [item.id]: Math.max(1, parseInt(e.target.value) || 1),
                                }))
                              }
                              className="w-16 border border-stone-300 rounded-lg px-2 py-1 text-sm text-center focus:outline-none focus:ring-2 focus:ring-amber-400"
                            />
                            <button
                              onClick={() => addToBasket(item)}
                              className="flex-1 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
                            >
                              Add to Basket
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </section>
            ))}
          </div>

          {/* Basket */}
          <aside className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-stone-100 p-5 sticky top-4">
              <h2 className="text-lg font-bold text-stone-900 mb-4 flex items-center gap-2">
                🛒 Your Basket
                {basket.length > 0 && (
                  <span className="bg-amber-500 text-white text-xs font-bold rounded-full px-2 py-0.5 ml-auto">
                    {basket.reduce((s, b) => s + b.quantity, 0)}
                  </span>
                )}
              </h2>

              {basket.length === 0 ? (
                <p className="text-stone-400 text-sm text-center py-6">
                  Your basket is empty.
                  <br />
                  Add items from the menu.
                </p>
              ) : (
                <>
                  <ul className="space-y-3 mb-4">
                    {basket.map((b) => (
                      <li
                        key={b.menuItem.id}
                        className="flex items-center gap-2 text-sm"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-stone-800 truncate">
                            {b.menuItem.name}
                          </p>
                          <p className="text-stone-400">
                            {formatGbp(b.menuItem.priceGbp)} ea
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => updateBasketQty(b.menuItem.id, -1)}
                            className="w-6 h-6 rounded bg-stone-100 hover:bg-stone-200 text-stone-600 font-bold text-xs"
                          >
                            −
                          </button>
                          <span className="w-6 text-center font-medium">{b.quantity}</span>
                          <button
                            onClick={() => updateBasketQty(b.menuItem.id, 1)}
                            className="w-6 h-6 rounded bg-stone-100 hover:bg-stone-200 text-stone-600 font-bold text-xs"
                          >
                            +
                          </button>
                        </div>
                        <span className="font-semibold text-stone-700 w-14 text-right">
                          {formatGbp(b.menuItem.priceGbp * b.quantity)}
                        </span>
                        <button
                          onClick={() => removeFromBasket(b.menuItem.id)}
                          className="text-red-400 hover:text-red-600 text-lg leading-none"
                          aria-label="Remove"
                        >
                          ×
                        </button>
                      </li>
                    ))}
                  </ul>
                  <div className="border-t border-stone-100 pt-3 mb-4 flex justify-between font-bold text-stone-900">
                    <span>Total</span>
                    <span>{formatGbp(basketTotal)}</span>
                  </div>
                  <button
                    onClick={() => setShowCheckout(true)}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 rounded-lg transition-colors"
                  >
                    Checkout
                  </button>
                </>
              )}
            </div>
          </aside>
        </div>
      )}

      {/* Checkout Modal */}
      {showCheckout && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-stone-900">Delivery Details</h2>
                <button
                  onClick={() => setShowCheckout(false)}
                  className="text-stone-400 hover:text-stone-600 text-2xl leading-none"
                >
                  ×
                </button>
              </div>

              {error && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handlePlaceOrder} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.customerName}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, customerName: e.target.value }))
                    }
                    placeholder="e.g. Jane Smith"
                    className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={form.customerEmail}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, customerEmail: e.target.value }))
                    }
                    placeholder="e.g. jane@example.co.uk"
                    className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={form.customerPhone}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, customerPhone: e.target.value }))
                    }
                    placeholder="e.g. 07700 900000"
                    className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    Delivery Address *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={form.deliveryAddress}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, deliveryAddress: e.target.value }))
                    }
                    placeholder="e.g. 42 High Street, London, EC1A 1BB"
                    className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
                  />
                  <p className="text-xs text-stone-400 mt-1">
                    Format: Street Address, City, Postcode
                  </p>
                </div>

                <div className="border-t border-stone-100 pt-4">
                  <div className="flex justify-between font-bold text-stone-900 mb-4">
                    <span>Order Total</span>
                    <span>{formatGbp(basketTotal)}</span>
                  </div>
                  <p className="text-xs text-stone-400 mb-4">
                    You will be redirected to our secure Shopify payment page to
                    complete your order. All prices include VAT.
                  </p>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-stone-300 text-white font-semibold py-3 rounded-lg transition-colors"
                  >
                    {submitting ? "Placing order…" : "Pay Securely with Shopify →"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
