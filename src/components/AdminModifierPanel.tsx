"use client";

import { FormEvent, useState } from "react";
import { formatGBP } from "@/lib/currency";
import type { MenuItem, ModifierGroup, Modifier } from "@/types";

type Props = {
  adminKey: string;
  item: MenuItem;
  onUpdated: () => void;
};

type ModifierDraft = {
  name: string;
  priceDeltaPence: string;
  isDefault: boolean;
};

export default function AdminModifierPanel({ adminKey, item, onUpdated }: Props) {
  const [groupName, setGroupName] = useState("");
  const [isRequired, setIsRequired] = useState(false);
  const [allowMultiple, setAllowMultiple] = useState(false);
  const [modifiers, setModifiers] = useState<ModifierDraft[]>([
    { name: "", priceDeltaPence: "0", isDefault: false },
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateModifier(index: number, field: keyof ModifierDraft, value: string | boolean) {
    setModifiers((prev) =>
      prev.map((m, i) => (i === index ? { ...m, [field]: value } : m)),
    );
  }

  function addModifierRow() {
    setModifiers((prev) => [...prev, { name: "", priceDeltaPence: "0", isDefault: false }]);
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
              <div key={index} className="flex items-center gap-2">
                <input
                  value={mod.name}
                  onChange={(e) => updateModifier(index, "name", e.target.value)}
                  placeholder={`Option ${index + 1} name`}
                  className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
                <input
                  type="number"
                  step="0.01"
                  value={mod.priceDeltaPence}
                  onChange={(e) => updateModifier(index, "priceDeltaPence", e.target.value)}
                  placeholder="Price +/-"
                  className="w-24 rounded-lg border border-slate-300 px-3 py-2 text-sm"
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
