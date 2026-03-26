"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { formatGBP } from "@/lib/currency";
import AdminModifierPanel from "@/components/AdminModifierPanel";
import type { MenuItem } from "@/types";

function parseCommaSeparatedValues(input: string): string[] {
  return Array.from(
    new Set(
      input
        .split(",")
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean),
    ),
  );
}

type AdminDashboardProps = {
  adminKey?: string;
};

export default function AdminDashboard({ adminKey: externalAdminKey }: AdminDashboardProps) {
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
  const [stockQuantity, setStockQuantity] = useState("0");
  const [allergensInput, setAllergensInput] = useState("");
  const [dietaryTagsInput, setDietaryTagsInput] = useState("");
  const [crossContaminationNotes, setCrossContaminationNotes] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [shopifyVariantId, setShopifyVariantId] = useState("");
  const [topUpValues, setTopUpValues] = useState<Record<string, string>>({});
  const [expandedModifierItem, setExpandedModifierItem] = useState<string | null>(null);

  const effectiveAdminKey = (externalAdminKey ?? adminKey).trim();

  useEffect(() => {
    if (!effectiveAdminKey) return;
    void loadItems(effectiveAdminKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveAdminKey]);

  async function loadItems(keyToUse = effectiveAdminKey) {
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

    const initialStock = Math.round(Number(stockQuantity));
    if (!Number.isFinite(initialStock) || initialStock < 0) {
      setError("Initial stock must be 0 or greater.");
      return;
    }

    let resolvedImageUrl = imageUrl.trim();

    if (imageFile) {
      setUploading(true);
      const formData = new FormData();
      formData.append("image", imageFile);

      const uploadResponse = await fetch("/api/admin/upload-image", {
        method: "POST",
        headers: {
          "x-admin-key": effectiveAdminKey,
        },
        body: formData,
      });

      const uploadPayload = await uploadResponse.json();
      setUploading(false);

      if (!uploadResponse.ok) {
        setError(uploadPayload.error ?? "Could not upload image.");
        return;
      }

      resolvedImageUrl = uploadPayload.imageUrl;
    }

    const response = await fetch("/api/admin/menu", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-key": effectiveAdminKey,
      },
      body: JSON.stringify({
        name,
        description,
        category,
        pricePence: price,
        stockQuantity: initialStock,
        allergens: parseCommaSeparatedValues(allergensInput),
        dietaryTags: parseCommaSeparatedValues(dietaryTagsInput),
        crossContaminationNotes,
        imageUrl: resolvedImageUrl,
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
    setStockQuantity("0");
    setAllergensInput("");
    setDietaryTagsInput("");
    setCrossContaminationNotes("");
    setImageUrl("");
    setImageFile(null);
    setShopifyVariantId("");
    await loadItems();
  }

  async function topUpItem(item: MenuItem) {
    const raw = topUpValues[item.id] ?? "";
    const quantityToAdd = Math.round(Number(raw));

    if (!Number.isFinite(quantityToAdd) || quantityToAdd <= 0) {
      setError("Top-up quantity must be at least 1.");
      return;
    }

    setError(null);
    setSuccess(null);

    const response = await fetch(`/api/admin/menu/${item.id}/stock`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-key": effectiveAdminKey,
      },
      body: JSON.stringify({ quantityToAdd }),
    });

    const payload = await response.json();

    if (!response.ok) {
      setError(payload.error ?? "Could not top up stock.");
      return;
    }

    setTopUpValues((prev) => ({ ...prev, [item.id]: "" }));
    setSuccess(`${payload.item.name} stock topped up by ${quantityToAdd}.`);
    await loadItems();
  }

  async function toggleAvailability(item: MenuItem) {
    setError(null);
    setSuccess(null);

    const response = await fetch(`/api/admin/menu/${item.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-admin-key": effectiveAdminKey,
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

      {!externalAdminKey && (
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
      )}

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
            value={stockQuantity}
            onChange={(event) => setStockQuantity(event.target.value)}
            placeholder="Initial stock quantity"
            type="number"
            min={0}
            required
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            value={allergensInput}
            onChange={(event) => setAllergensInput(event.target.value)}
            placeholder="Allergens (comma separated)"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm sm:col-span-2"
          />
          <input
            value={dietaryTagsInput}
            onChange={(event) => setDietaryTagsInput(event.target.value)}
            placeholder="Dietary tags (comma separated, e.g. halal, vegan)"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm sm:col-span-2"
          />
          <textarea
            value={crossContaminationNotes}
            onChange={(event) => setCrossContaminationNotes(event.target.value)}
            placeholder="Cross-contamination notes (optional)"
            rows={2}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm sm:col-span-2"
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
            placeholder="Image URL (optional if uploading file)"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm sm:col-span-2"
          />
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(event) => setImageFile(event.target.files?.[0] ?? null)}
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
            disabled={uploading}
            className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white sm:col-span-2"
          >
            {uploading ? "Uploading image..." : "Add dish"}
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
                      className="rounded-lg border border-slate-200 p-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-medium text-slate-900">{item.name}</p>
                          <p className="text-sm text-slate-600">{formatGBP(item.pricePence)}</p>
                          <p className="text-xs font-medium text-slate-700">
                            In stock: {item.stockQuantity}
                          </p>
                          {item.imageUrl ? (
                            <div className="mt-2 overflow-hidden rounded-md border border-slate-200">
                              <Image
                                src={item.imageUrl}
                                alt={item.name}
                                width={96}
                                height={72}
                                className="h-[72px] w-24 object-cover"
                              />
                            </div>
                          ) : null}
                          {item.allergens.length > 0 ? (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {item.allergens.map((allergen) => (
                                <span
                                  key={allergen}
                                  className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-rose-700"
                                >
                                  {allergen}
                                </span>
                              ))}
                            </div>
                          ) : null}
                          {item.dietaryTags.length > 0 ? (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {item.dietaryTags.map((tag) => (
                                <span
                                  key={tag}
                                  className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-emerald-700"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          ) : null}
                          {item.crossContaminationNotes ? (
                            <p className="mt-2 max-w-md text-xs text-amber-700">
                              Cross-contamination: {item.crossContaminationNotes}
                            </p>
                          ) : null}
                          <p className="text-xs text-slate-500">
                            Shopify: {item.shopifyVariantId ? "Connected" : "Missing variant ID"}
                          </p>
                          {item.modifierGroups && item.modifierGroups.length > 0 ? (
                            <p className="mt-1 text-xs font-medium text-purple-700">
                              {item.modifierGroups.length} modifier group{item.modifierGroups.length === 1 ? "" : "s"}
                            </p>
                          ) : null}
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
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min={1}
                            value={topUpValues[item.id] ?? ""}
                            onChange={(event) =>
                              setTopUpValues((prev) => ({ ...prev, [item.id]: event.target.value }))
                            }
                            placeholder="Top up qty"
                            className="w-28 rounded-lg border border-slate-300 px-2 py-2 text-xs"
                          />
                          <button
                            type="button"
                            onClick={() => void topUpItem(item)}
                            className="rounded-lg bg-blue-700 px-3 py-2 text-xs font-semibold text-white"
                          >
                            Top up
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedModifierItem((prev) => (prev === item.id ? null : item.id))
                          }
                          className="rounded-lg bg-purple-50 px-3 py-2 text-xs font-semibold text-purple-700 hover:bg-purple-100"
                        >
                          {expandedModifierItem === item.id ? "Hide modifiers" : "Manage modifiers"}
                        </button>
                      </div>

                      {expandedModifierItem === item.id && (
                        <div className="mt-3 border-t border-slate-200 pt-3">
                          <AdminModifierPanel
                            adminKey={effectiveAdminKey}
                            item={item}
                            onUpdated={() => void loadItems()}
                          />
                        </div>
                      )}
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
