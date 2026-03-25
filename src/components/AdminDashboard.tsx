"use client";

import { FormEvent, useMemo, useState } from "react";
import { formatGBP } from "@/lib/currency";
import type { MenuItem } from "@/types";

export default function AdminDashboard() {
  const [adminKey, setAdminKey] = useState(() => {
    if (typeof window === "undefined") {
      return "";
    }
    return localStorage.getItem("adminKey") ?? "";
  });
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Main");
  const [priceGBP, setPriceGBP] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [shopifyVariantId, setShopifyVariantId] = useState("");

  async function loadItems(keyToUse = adminKey) {
    if (!keyToUse) return;

    setLoading(true);
    setError(null);

    const response = await fetch("/api/admin/menu", {
      headers: {
        "x-admin-key": keyToUse,
      },
    });

    const payload = await response.json();

    if (!response.ok) {
      setError(payload.error ?? "Could not load menu items.");
      setLoading(false);
      return;
    }

    setItems(payload.items);
    setLoading(false);
  }

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

  async function createItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const price = Math.round(Number(priceGBP) * 100);
    if (!Number.isFinite(price) || price < 50) {
      setError("Price must be at least £0.50.");
      return;
    }

    const response = await fetch("/api/admin/menu", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-key": adminKey,
      },
      body: JSON.stringify({
        name,
        description,
        category,
        pricePence: price,
        imageUrl,
        shopifyVariantId,
        isAvailable: true,
      }),
    });

    const payload = await response.json();

    if (!response.ok) {
      setError(payload.error ?? "Could not create menu item.");
      return;
    }

    setSuccess(`${payload.item.name} added to menu.`);
    setName("");
    setDescription("");
    setPriceGBP("");
    setImageUrl("");
    setShopifyVariantId("");
    await loadItems();
  }

  async function toggleAvailability(item: MenuItem) {
    setError(null);
    setSuccess(null);

    const response = await fetch(`/api/admin/menu/${item.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-admin-key": adminKey,
      },
      body: JSON.stringify({
        isAvailable: !item.isAvailable,
      }),
    });

    const payload = await response.json();

    if (!response.ok) {
      setError(payload.error ?? "Could not update item.");
      return;
    }

    setSuccess(`${payload.item.name} updated.`);
    await loadItems();
  }

  function saveAdminKey() {
    localStorage.setItem("adminKey", adminKey);
    setSuccess("Admin key saved in your browser.");
    void loadItems(adminKey);
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <header className="rounded-2xl bg-slate-900 px-6 py-8 text-white shadow-md">
        <h1 className="text-2xl font-bold">Restaurant Admin</h1>
        <p className="mt-2 text-sm text-slate-200">
          Add dishes, set Shopify variant IDs, and control item availability.
        </p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Admin Access</h2>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
          <input
            type="password"
            value={adminKey}
            onChange={(event) => setAdminKey(event.target.value)}
            placeholder="Enter ADMIN_DASHBOARD_KEY"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={saveAdminKey}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
          >
            Save key
          </button>
          <button
            type="button"
            onClick={() => void loadItems()}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
          >
            Refresh menu
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Add Menu Item</h2>
        <form onSubmit={createItem} className="mt-4 grid gap-3 sm:grid-cols-2">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Dish name"
            required
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            placeholder="Category"
            required
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            value={priceGBP}
            onChange={(event) => setPriceGBP(event.target.value)}
            placeholder="Price in GBP (e.g. 12.95)"
            required
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            value={shopifyVariantId}
            onChange={(event) => setShopifyVariantId(event.target.value)}
            placeholder="Shopify variant GID"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            value={imageUrl}
            onChange={(event) => setImageUrl(event.target.value)}
            placeholder="Image URL (optional)"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm sm:col-span-2"
          />
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Description"
            required
            rows={3}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm sm:col-span-2"
          />
          <button
            type="submit"
            className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white sm:col-span-2"
          >
            Add dish
          </button>
        </form>
      </section>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-700">{success}</p> : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Current Menu</h2>
          {loading ? <p className="text-sm text-slate-500">Loading...</p> : null}
        </div>

        <div className="mt-4 space-y-6">
          {Object.keys(grouped).length === 0 ? (
            <p className="text-sm text-slate-600">No menu items yet.</p>
          ) : (
            Object.entries(grouped).map(([group, entries]) => (
              <div key={group} className="space-y-2">
                <h3 className="text-base font-semibold text-slate-900">{group}</h3>
                <div className="space-y-2">
                  {entries.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 p-3"
                    >
                      <div>
                        <p className="font-medium text-slate-900">{item.name}</p>
                        <p className="text-sm text-slate-600">{formatGBP(item.pricePence)}</p>
                        <p className="text-xs text-slate-500">
                          Shopify: {item.shopifyVariantId ? "Connected" : "Missing variant ID"}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleAvailability(item)}
                        className={`rounded-lg px-3 py-2 text-xs font-semibold text-white ${
                          item.isAvailable ? "bg-orange-600" : "bg-emerald-700"
                        }`}
                      >
                        {item.isAvailable ? "Mark unavailable" : "Mark available"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
