"use client";

import { FormEvent, useState } from "react";
import { formatGBP } from "@/lib/currency";
import type { MenuItem, ModifierGroup, Modifier } from "@/types";

type Props = {
  adminKey: string;
  item: MenuItem;
  allItems: MenuItem[];
  onUpdated: () => void;
};

type ModifierDraft = {
  name: string;
  priceDeltaPence: string;
  isDefault: boolean;
  linkedFoodItemId?: string;
};

export default function AdminModifierPanel({ adminKey, item, allItems, onUpdated }: Props) {
  const [groupName, setGroupName] = useState("");
  const [isRequired, setIsRequired] = useState(false);
  const [allowMultiple, setAllowMultiple] = useState(false);
  const [modifiers, setModifiers] = useState<ModifierDraft[]>([
    { name: "", priceDeltaPence: "0", isDefault: false },
  ]);
  const [newModifierName, setNewModifierName] = useState("");
  const [newModifierPriceGBP, setNewModifierPriceGBP] = useState("0.50");
  const [newModifierIndependentOrder, setNewModifierIndependentOrder] = useState(false);
  const [creatingNewModifierItem, setCreatingNewModifierItem] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectableFoodItems = allItems
    .filter((food) => food.id !== item.id)
    .sort((a, b) => a.name.localeCompare(b.name));

  function updateModifier(index: number, field: keyof ModifierDraft, value: string | boolean) {
    setModifiers((prev) =>
      prev.map((m, i) => (i === index ? { ...m, [field]: value } : m)),
    );
  }

  function addModifierRow() {
    setModifiers((prev) => [...prev, { name: "", priceDeltaPence: "0", isDefault: false }]);
  }

  function assignModifierFromFoodItem(index: number, foodItemId: string) {
    const selected = selectableFoodItems.find((food) => food.id === foodItemId);
    if (!selected) {
      updateModifier(index, "linkedFoodItemId", "");
      return;
    }

    setModifiers((prev) =>
      prev.map((modifier, i) =>
        i === index
          ? {
              ...modifier,
              linkedFoodItemId: selected.id,
              name: selected.name,
              priceDeltaPence: (selected.pricePence / 100).toFixed(2),
            }
          : modifier,
      ),
    );
  }

  function removeModifierRow(index: number) {
    setModifiers((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const validModifiers = modifiers.filter((m) => m.name.trim());
    if (validModifiers.length === 0) {
      setError("Add at least one modifier option.");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/admin/menu/${item.id}/modifiers`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({
          name: groupName.trim(),
          isRequired,
          allowMultiple,
          displayOrder: item.modifierGroups.length,
          modifiers: validModifiers.map((m, i) => ({
            name: m.name.trim(),
            linkedFoodItemId: m.linkedFoodItemId || "",
            priceDeltaPence: Math.round(parseFloat(m.priceDeltaPence || "0") * 100),
            isDefault: m.isDefault,
            displayOrder: i,
          })),
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error ?? "Could not save modifier group.");
        return;
      }

      // Reset form
      setGroupName("");
      setIsRequired(false);
      setAllowMultiple(false);
      setModifiers([{ name: "", priceDeltaPence: "0", isDefault: false }]);
      onUpdated();
    } catch {
      setError("Unexpected error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function createFoodItemAsModifier() {
    setError(null);

    const name = newModifierName.trim();
    const pricePence = Math.round(parseFloat(newModifierPriceGBP || "0") * 100);

    if (!name) {
      setError("Enter a name for the new modifier food item.");
      return;
    }

    if (!Number.isFinite(pricePence) || pricePence < 50) {
      setError("Price for a new food item modifier must be at least £0.50.");
      return;
    }

    setCreatingNewModifierItem(true);
    try {
      const response = await fetch("/api/admin/menu", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({
          name,
          description: `${name} (modifier option)`,
          category: "Modifier Options",
          pricePence,
          stockQuantity: 1000,
          allergens: [],
          dietaryTags: [],
          crossContaminationNotes: "",
          imageUrl: "",
          shopifyVariantId: "",
          isAvailable: newModifierIndependentOrder,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error ?? "Could not create food item for modifier.");
        return;
      }

      setModifiers((prev) => [
        ...prev,
        {
          name: payload.item.name,
          priceDeltaPence: (payload.item.pricePence / 100).toFixed(2),
          isDefault: false,
          linkedFoodItemId: payload.item.id,
        },
      ]);

      setNewModifierName("");
      setNewModifierPriceGBP("0.50");
      setNewModifierIndependentOrder(false);
      await onUpdated();
    } catch {
      setError("Unexpected error creating modifier food item.");
    } finally {
      setCreatingNewModifierItem(false);
    }
  }

  async function deleteGroup(groupId: string) {
    if (!confirm("Delete this modifier group and all its options?")) return;

    try {
      const response = await fetch(`/api/admin/modifiers/${groupId}`, {
        method: "DELETE",
        headers: { "x-admin-key": adminKey },
      });

      if (!response.ok) {
        const payload = await response.json();
        alert(payload.error ?? "Could not delete modifier group.");
        return;
      }

      onUpdated();
    } catch {
      alert("Unexpected error. Please try again.");
    }
  }

  return (
    <div className="mt-4 space-y-6">
      {/* Existing modifier groups */}
      {item.modifierGroups && item.modifierGroups.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-slate-700">Current modifier groups</h4>
          {item.modifierGroups.map((group: ModifierGroup) => (
            <div key={group.id} className="rounded-lg border border-slate-200 p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-slate-900">{group.name}</p>
                  <p className="text-xs text-slate-500">
                    {group.isRequired ? "Required" : "Optional"} ·{" "}
                    {group.allowMultiple ? "Multi-select" : "Single-select"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void deleteGroup(group.id)}
                  className="rounded-lg bg-red-50 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-100"
                >
                  Delete
                </button>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {group.modifiers.map((mod: Modifier) => (
                  <span
                    key={mod.id}
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-700"
                  >
                    {mod.name}
                    {mod.linkedFoodItemId && (
                      <span className="ml-1 rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-700">
                        Linked item
                      </span>
                    )}
                    {mod.priceDeltaPence !== 0 && (
                      <span className="ml-1 text-slate-500">
                        ({mod.priceDeltaPence > 0 ? "+" : ""}{formatGBP(mod.priceDeltaPence)})
                      </span>
                    )}
                    {mod.isDefault && <span className="ml-1 text-emerald-600">✓</span>}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add new modifier group */}
      <div>
        <h4 className="mb-3 text-sm font-semibold text-slate-700">Add modifier group</h4>
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3">
          <input
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Group name (e.g. Swallow Choice, Spice Level)"
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <div className="flex gap-4 text-sm">
            <label className="flex items-center gap-2 text-slate-700">
              <input
                type="checkbox"
                checked={isRequired}
                onChange={(e) => setIsRequired(e.target.checked)}
                className="h-4 w-4 rounded"
              />
              Required
            </label>
            <label className="flex items-center gap-2 text-slate-700">
              <input
                type="checkbox"
                checked={allowMultiple}
                onChange={(e) => setAllowMultiple(e.target.checked)}
                className="h-4 w-4 rounded"
              />
              Allow multiple selections
            </label>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium text-slate-600">Options</p>
            {modifiers.map((mod, index) => (
              <div key={index} className="grid gap-2 rounded-lg border border-slate-200 p-2 sm:grid-cols-[1.1fr_1fr_120px_auto_auto] sm:items-center">
                <select
                  value={mod.linkedFoodItemId ?? ""}
                  onChange={(e) => assignModifierFromFoodItem(index, e.target.value)}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  title="Use an existing food item as this modifier"
                >
                  <option value="">Use custom option name</option>
                  {selectableFoodItems.map((food) => (
                    <option key={food.id} value={food.id}>
                      {food.name} ({formatGBP(food.pricePence)}){food.isAvailable ? "" : " - hidden from independent ordering"}
                    </option>
                  ))}
                </select>
                <input
                  value={mod.name}
                  onChange={(e) => {
                    updateModifier(index, "name", e.target.value);
                    updateModifier(index, "linkedFoodItemId", "");
                  }}
                  placeholder={`Option ${index + 1} name`}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
                <input
                  type="number"
                  step="0.01"
                  value={mod.priceDeltaPence}
                  onChange={(e) => updateModifier(index, "priceDeltaPence", e.target.value)}
                  placeholder="Price +/-"
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  title="Price adjustment in GBP (e.g. 1.50 or -0.50)"
                />
                <label className="flex items-center gap-1 text-xs text-slate-600" title="Pre-selected by default">
                  <input
                    type="checkbox"
                    checked={mod.isDefault}
                    onChange={(e) => updateModifier(index, "isDefault", e.target.checked)}
                    className="h-3.5 w-3.5"
                  />
                  Default
                </label>
                {modifiers.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeModifierRow(index)}
                    className="rounded-lg bg-red-50 px-2 py-2 text-xs text-red-600 hover:bg-red-100"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addModifierRow}
              className="text-xs font-medium text-blue-600 hover:text-blue-700"
            >
              + Add option
            </button>
          </div>

          <div className="space-y-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3">
            <p className="text-xs font-semibold text-slate-700">Add new food item as modifier option</p>
            <p className="text-xs text-slate-500">
              Use this when an option does not exist yet. You can decide if it should also be orderable independently on the public menu.
            </p>
            <div className="grid gap-2 sm:grid-cols-[1fr_130px_auto]">
              <input
                value={newModifierName}
                onChange={(e) => setNewModifierName(e.target.value)}
                placeholder="New modifier item name (e.g. Goat Meat)"
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              />
              <input
                type="number"
                step="0.01"
                value={newModifierPriceGBP}
                onChange={(e) => setNewModifierPriceGBP(e.target.value)}
                placeholder="Price"
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={() => void createFoodItemAsModifier()}
                disabled={creatingNewModifierItem}
                className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
              >
                {creatingNewModifierItem ? "Adding..." : "Add as option"}
              </button>
            </div>
            <label className="flex items-center gap-2 text-xs text-slate-700">
              <input
                type="checkbox"
                checked={newModifierIndependentOrder}
                onChange={(e) => setNewModifierIndependentOrder(e.target.checked)}
              />
              Allow independent ordering on public menu
            </label>
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-purple-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save modifier group"}
          </button>
        </form>
      </div>
    </div>
  );
}
