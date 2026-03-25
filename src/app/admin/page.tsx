"use client";

import { useEffect, useState } from "react";

interface MenuItem {
  id: number;
  name: string;
  description: string;
  category: string;
  priceGbp: number;
  imageUrl: string;
  shopifyVariantId: string;
  available: boolean;
}

interface MenuItemForm {
  name: string;
  description: string;
  category: string;
  priceGbp: string;
  imageUrl: string;
  shopifyVariantId: string;
  available: boolean;
}

const EMPTY_FORM: MenuItemForm = {
  name: "",
  description: "",
  category: "",
  priceGbp: "",
  imageUrl: "",
  shopifyVariantId: "",
  available: true,
};

function formatGbp(amount: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(amount);
}

export default function AdminPage() {
  const [apiKey, setApiKey] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [authError, setAuthError] = useState("");

  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [form, setForm] = useState<MenuItemForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  async function loadItems(key: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/menu", {
        headers: { "x-admin-key": key },
      });
      if (res.status === 401) {
        setAuthError("Invalid admin key. Please try again.");
        setAuthenticated(false);
        return;
      }
      if (!res.ok) throw new Error("Failed to load items.");
      const data: MenuItem[] = await res.json();
      setItems(data);
      setAuthenticated(true);
      setAuthError("");
    } catch {
      setError("Failed to load menu items.");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    await loadItems(apiKey);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const payload = {
        name: form.name,
        description: form.description,
        category: form.category,
        priceGbp: parseFloat(form.priceGbp),
        imageUrl: form.imageUrl,
        shopifyVariantId: form.shopifyVariantId,
        available: form.available,
      };

      let res: Response;
      if (editingItem) {
        res = await fetch(`/api/admin/menu/${editingItem.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "x-admin-key": apiKey,
          },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/admin/menu", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-admin-key": apiKey,
          },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to save item.");
        return;
      }

      setSuccess(editingItem ? "Item updated successfully." : "Item added successfully.");
      setShowForm(false);
      setEditingItem(null);
      setForm(EMPTY_FORM);
      await loadItems(apiKey);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(item: MenuItem) {
    if (!confirm(`Delete "${item.name}"? This cannot be undone.`)) return;
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/admin/menu/${item.id}`, {
        method: "DELETE",
        headers: { "x-admin-key": apiKey },
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to delete item.");
        return;
      }
      setSuccess(`"${item.name}" deleted.`);
      await loadItems(apiKey);
    } catch {
      setError("Network error. Please try again.");
    }
  }

  function openAddForm() {
    setEditingItem(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
    setError(null);
    setSuccess(null);
  }

  function openEditForm(item: MenuItem) {
    setEditingItem(item);
    setForm({
      name: item.name,
      description: item.description,
      category: item.category,
      priceGbp: item.priceGbp.toString(),
      imageUrl: item.imageUrl,
      shopifyVariantId: item.shopifyVariantId,
      available: item.available,
    });
    setShowForm(true);
    setError(null);
    setSuccess(null);
  }

  // Auto-dismiss success messages
  useEffect(() => {
    if (success) {
      const t = setTimeout(() => setSuccess(null), 3000);
      return () => clearTimeout(t);
    }
  }, [success]);

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg w-full max-w-sm p-8">
          <div className="text-center mb-6">
            <div className="text-4xl mb-3">🔐</div>
            <h1 className="text-2xl font-bold text-stone-900">Admin Login</h1>
            <p className="text-stone-500 text-sm mt-1">
              Enter your admin API key to continue
            </p>
          </div>
          {authError && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
              {authError}
            </div>
          )}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                Admin API Key
              </label>
              <input
                type="password"
                required
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter admin key"
                className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-stone-900 hover:bg-stone-700 text-white font-semibold py-2.5 rounded-lg transition-colors"
            >
              Sign In
            </button>
          </form>
        </div>
      </div>
    );
  }

  const categories = Array.from(new Set(items.map((m) => m.category))).sort();

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-stone-900">Menu Management</h1>
          <p className="text-stone-500 mt-1">
            Add, edit or remove items from the restaurant menu
          </p>
        </div>
        <button
          onClick={openAddForm}
          className="bg-amber-500 hover:bg-amber-600 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors flex items-center gap-2"
        >
          + Add Item
        </button>
      </div>

      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm">
          ✅ {success}
        </div>
      )}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          ❌ {error}
        </div>
      )}

      {loading ? (
        <p className="text-stone-400 animate-pulse text-center py-16">
          Loading menu items…
        </p>
      ) : items.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-stone-400 mb-4">No menu items yet.</p>
          <button
            onClick={openAddForm}
            className="bg-amber-500 hover:bg-amber-600 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors"
          >
            Add your first item
          </button>
        </div>
      ) : (
        <div className="space-y-10">
          {categories.map((category) => (
            <section key={category}>
              <h2 className="text-lg font-semibold text-stone-700 border-b border-stone-200 pb-2 mb-4">
                {category}
              </h2>
              <div className="bg-white rounded-xl shadow-sm border border-stone-100 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-stone-50 border-b border-stone-100">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium text-stone-600">Name</th>
                      <th className="text-left px-4 py-3 font-medium text-stone-600 hidden md:table-cell">Description</th>
                      <th className="text-right px-4 py-3 font-medium text-stone-600">Price</th>
                      <th className="text-center px-4 py-3 font-medium text-stone-600">Available</th>
                      <th className="text-right px-4 py-3 font-medium text-stone-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-50">
                    {items
                      .filter((m) => m.category === category)
                      .map((item) => (
                        <tr key={item.id} className="hover:bg-stone-50 transition-colors">
                          <td className="px-4 py-3 font-medium text-stone-900">
                            {item.name}
                          </td>
                          <td className="px-4 py-3 text-stone-500 hidden md:table-cell max-w-xs truncate">
                            {item.description}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-amber-600">
                            {formatGbp(item.priceGbp)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                                item.available
                                  ? "bg-green-100 text-green-700"
                                  : "bg-stone-100 text-stone-500"
                              }`}
                            >
                              {item.available ? "Available" : "Hidden"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => openEditForm(item)}
                              className="text-stone-500 hover:text-stone-900 font-medium mr-3 transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(item)}
                              className="text-red-400 hover:text-red-600 font-medium transition-colors"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-stone-900">
                  {editingItem ? "Edit Menu Item" : "Add Menu Item"}
                </h2>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingItem(null);
                  }}
                  className="text-stone-400 hover:text-stone-600 text-2xl leading-none"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-stone-700 mb-1">
                      Item Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder="e.g. Fish & Chips"
                      className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-stone-700 mb-1">
                      Description *
                    </label>
                    <textarea
                      required
                      rows={2}
                      value={form.description}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, description: e.target.value }))
                      }
                      placeholder="e.g. Classic battered cod with chunky chips, mushy peas and tartare sauce"
                      className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">
                      Category *
                    </label>
                    <input
                      type="text"
                      required
                      list="category-list"
                      value={form.category}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, category: e.target.value }))
                      }
                      placeholder="e.g. Mains"
                      className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                    <datalist id="category-list">
                      {categories.map((c) => (
                        <option key={c} value={c} />
                      ))}
                    </datalist>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">
                      Price (£) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0.01"
                      step="0.01"
                      value={form.priceGbp}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, priceGbp: e.target.value }))
                      }
                      placeholder="e.g. 12.99"
                      className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-stone-700 mb-1">
                      Image URL
                    </label>
                    <input
                      type="url"
                      value={form.imageUrl}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, imageUrl: e.target.value }))
                      }
                      placeholder="https://example.com/image.jpg"
                      className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-stone-700 mb-1">
                      Shopify Variant ID
                    </label>
                    <input
                      type="text"
                      value={form.shopifyVariantId}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, shopifyVariantId: e.target.value }))
                      }
                      placeholder="gid://shopify/ProductVariant/12345678"
                      className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                    <p className="text-xs text-stone-400 mt-1">
                      Required for Shopify checkout integration. Find this in your Shopify admin.
                    </p>
                  </div>

                  <div className="col-span-2 flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="available"
                      checked={form.available}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, available: e.target.checked }))
                      }
                      className="w-4 h-4 accent-amber-500"
                    />
                    <label
                      htmlFor="available"
                      className="text-sm font-medium text-stone-700 cursor-pointer"
                    >
                      Available on menu (visible to customers)
                    </label>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingItem(null);
                    }}
                    className="flex-1 border border-stone-300 text-stone-700 hover:bg-stone-50 font-medium py-2.5 rounded-lg transition-colors text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 bg-amber-500 hover:bg-amber-600 disabled:bg-stone-300 text-white font-semibold py-2.5 rounded-lg transition-colors text-sm"
                  >
                    {saving ? "Saving…" : editingItem ? "Save Changes" : "Add Item"}
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
