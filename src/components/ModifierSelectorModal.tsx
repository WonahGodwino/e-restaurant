"use client";

import { useState } from "react";
import { formatGBP } from "@/lib/currency";
import type { MenuItem, ModifierGroup } from "@/types";
import type { SelectedModifier } from "@/components/CartProvider";

type Props = {
  item: MenuItem;
  onConfirm: (selectedModifiers: SelectedModifier[]) => void;
  onClose: () => void;
};

function computeEffectivePrice(basePence: number, selections: SelectedModifier[]): number {
  return basePence + selections.reduce((sum, m) => sum + m.priceDeltaPence, 0);
}

export default function ModifierSelectorModal({ item, onConfirm, onClose }: Props) {
  const [selections, setSelections] = useState<SelectedModifier[]>(() => {
    // Pre-select defaults
    const defaults: SelectedModifier[] = [];
    for (const group of item.modifierGroups) {
      const defaultMod = group.modifiers.find((m) => m.isDefault);
      if (defaultMod && !group.allowMultiple) {
        defaults.push({
          modifierId: defaultMod.id,
          modifierName: defaultMod.name,
          groupName: group.name,
          priceDeltaPence: defaultMod.priceDeltaPence,
        });
      }
    }
    return defaults;
  });

  function isSelected(modifierId: string): boolean {
    return selections.some((s) => s.modifierId === modifierId);
  }

  function toggleModifier(group: ModifierGroup, modifierId: string, modifierName: string, priceDeltaPence: number) {
    if (group.allowMultiple) {
      setSelections((prev) => {
        const already = prev.find((s) => s.modifierId === modifierId);
        if (already) {
          return prev.filter((s) => s.modifierId !== modifierId);
        }
        return [...prev, { modifierId, modifierName, groupName: group.name, priceDeltaPence }];
      });
    } else {
      // Single select: replace any existing selection for this group
      setSelections((prev) => {
        const filtered = prev.filter((s) => s.groupName !== group.name);
        return [...filtered, { modifierId, modifierName, groupName: group.name, priceDeltaPence }];
      });
    }
  }

  function isGroupSatisfied(group: ModifierGroup): boolean {
    if (!group.isRequired) return true;
    return selections.some((s) => s.groupName === group.name);
  }

  const allSatisfied = item.modifierGroups.every(isGroupSatisfied);
  const effectivePrice = computeEffectivePrice(item.pricePence, selections);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="surface-panel flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-[2rem]">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-white/10 p-6">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-white/50">{item.category}</p>
            <h2 className="mt-1 text-xl font-semibold text-white">{item.name}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/70 hover:bg-white/16"
          >
            ✕
          </button>
        </div>

        {/* Modifier groups */}
        <div className="flex-1 space-y-6 overflow-y-auto p-6">
          {item.modifierGroups.map((group) => (
            <fieldset key={group.id}>
              <legend className="flex items-center gap-2 text-sm font-semibold text-white">
                {group.name}
                {group.isRequired && (
                  <span className="rounded-full bg-[var(--accent)]/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
                    Required
                  </span>
                )}
                {group.allowMultiple ? (
                  <span className="text-xs font-normal text-white/45">(choose any)</span>
                ) : (
                  <span className="text-xs font-normal text-white/45">(choose one)</span>
                )}
              </legend>
              <div className="mt-3 space-y-2">
                {group.modifiers.map((mod) => {
                  const selected = isSelected(mod.id);
                  return (
                    <button
                      key={mod.id}
                      type="button"
                      onClick={() => toggleModifier(group, mod.id, mod.name, mod.priceDeltaPence)}
                      className={[
                        "flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition",
                        selected
                          ? "border-[var(--accent)]/60 bg-[var(--accent)]/15 text-white"
                          : "border-white/10 bg-white/4 text-white/80 hover:bg-white/8",
                      ].join(" ")}
                    >
                      <span className="flex items-center gap-3">
                        <span
                          className={[
                            "flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border text-[10px]",
                            selected
                              ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                              : "border-white/30 bg-white/5",
                          ].join(" ")}
                        >
                          {selected ? "✓" : ""}
                        </span>
                        {mod.name}
                      </span>
                      {mod.priceDeltaPence !== 0 && (
                        <span className={mod.priceDeltaPence > 0 ? "text-[var(--cream)]" : "text-emerald-300"}>
                          {mod.priceDeltaPence > 0 ? "+" : ""}
                          {formatGBP(mod.priceDeltaPence)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-4 border-t border-white/10 p-6">
          <div>
            <p className="text-xs text-white/50">Total price</p>
            <p className="text-xl font-semibold text-white">{formatGBP(effectivePrice)}</p>
          </div>
          <button
            type="button"
            disabled={!allSatisfied}
            onClick={() => onConfirm(selections)}
            className={[
              "rounded-full px-6 py-3 text-sm font-semibold text-white transition",
              allSatisfied
                ? "bg-[var(--accent-strong)] shadow-[0_16px_35px_rgba(240,90,40,0.22)] hover:-translate-y-0.5 hover:brightness-105"
                : "cursor-not-allowed bg-white/10 text-white/40",
            ].join(" ")}
          >
            Add to cart
          </button>
        </div>
      </div>
    </div>
  );
}
