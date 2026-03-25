"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useCart } from "@/components/CartProvider";
import ModifierSelectorModal from "@/components/ModifierSelectorModal";
import { formatGBP } from "@/lib/currency";
import type { MenuItem } from "@/types";
import type { SelectedModifier } from "@/components/CartProvider";

export default function MenuCatalogClient({ items }: { items: MenuItem[] }) {
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeDietaryTags, setActiveDietaryTags] = useState<string[]>([]);
  const { addItem, items: cartItems } = useCart();
  const [pendingItem, setPendingItem] = useState<MenuItem | null>(null);

  const categories = useMemo(() => ["All", ...Array.from(new Set(items.map((item) => item.category)))], [items]);
  const dietaryTagOptions = useMemo(
    () => Array.from(new Set(items.flatMap((item) => item.dietaryTags))).sort(),
    [items],
  );

  const filtered = useMemo(() => {
    const categoryFiltered =
      activeCategory === "All"
        ? items
        : items.filter((item) => item.category === activeCategory);

    if (activeDietaryTags.length === 0) {
      return categoryFiltered;
    }

    return categoryFiltered.filter((item) =>
      activeDietaryTags.every((tag) => item.dietaryTags.includes(tag)),
    );
  }, [activeCategory, activeDietaryTags, items]);

  function toggleDietaryTag(tag: string) {
    setActiveDietaryTags((current) =>
      current.includes(tag)
        ? current.filter((value) => value !== tag)
        : [...current, tag],
    );
  }

  function handleAddToCart(item: MenuItem) {
    if (item.modifierGroups && item.modifierGroups.length > 0) {
      setPendingItem(item);
    } else {
      addItem(item);
    }
  }

  function handleModifierConfirm(selectedModifiers: SelectedModifier[]) {
    if (pendingItem) {
      addItem(pendingItem, selectedModifiers);
      setPendingItem(null);
    }
  }

  return (
    <div className="space-y-8">
      {pendingItem && (
        <ModifierSelectorModal
          item={pendingItem}
          onConfirm={handleModifierConfirm}
          onClose={() => setPendingItem(null)}
        />
      )}

      <div className="flex flex-wrap gap-3">
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => setActiveCategory(category)}
            className={[
              "rounded-full px-4 py-2 text-sm font-semibold transition",
              activeCategory === category
                ? "bg-[var(--accent-strong)] text-white shadow-[0_16px_35px_rgba(240,90,40,0.24)]"
                : "border border-white/10 bg-white/6 text-white/72 hover:bg-white/10 hover:text-white",
            ].join(" ")}
          >
            {category}
          </button>
        ))}
      </div>

      {dietaryTagOptions.length > 0 ? (
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
            Filter by dietary tags
          </p>
          <div className="flex flex-wrap gap-2">
            {dietaryTagOptions.map((tag) => {
              const active = activeDietaryTags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleDietaryTag(tag)}
                  className={[
                    "rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] transition",
                    active
                      ? "bg-emerald-500/25 text-emerald-100 border border-emerald-300/35"
                      : "border border-white/10 bg-white/6 text-white/70 hover:bg-white/10 hover:text-white",
                  ].join(" ")}
                >
                  {tag}
                </button>
              );
            })}
            {activeDietaryTags.length > 0 ? (
              <button
                type="button"
                onClick={() => setActiveDietaryTags([])}
                className="rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-white/70 transition hover:bg-white/10 hover:text-white"
              >
                Clear filters
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      <p className="text-sm text-white/58">
        {filtered.length} item{filtered.length === 1 ? "" : "s"} in {activeCategory === "All" ? "all categories" : activeCategory}
      </p>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((item) => {
          const inCart = cartItems.find((entry) => entry.id === item.id);

          return (
            <article key={item.id} className="surface-panel overflow-hidden rounded-[1.75rem]">
              {item.imageUrl ? (
                <Image src={item.imageUrl} alt={item.name} width={640} height={420} className="h-52 w-full object-cover" />
              ) : (
                <div className="flex h-52 items-center justify-center bg-[linear-gradient(135deg,rgba(127,86,217,0.22),rgba(240,90,40,0.18))] text-5xl">
                  🍛
                </div>
              )}

              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-white/45">{item.category}</p>
                    <h3 className="mt-2 text-xl font-semibold text-white">{item.name}</h3>
                  </div>
                  <span className="rounded-full border border-[var(--accent)]/25 bg-[var(--accent)]/10 px-3 py-1 text-xs font-semibold text-[var(--cream)]">
                    {formatGBP(item.pricePence)}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-7 text-white/66">{item.description}</p>
                {item.modifierGroups && item.modifierGroups.length > 0 ? (
                  <p className="mt-2 text-xs text-white/45">
                    Customisable · {item.modifierGroups.length} option group{item.modifierGroups.length === 1 ? "" : "s"}
                  </p>
                ) : null}
                {item.dietaryTags.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {item.dietaryTags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-emerald-300/30 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-200"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null}
                {item.allergens.length > 0 ? (
                  <p className="mt-3 text-xs leading-6 text-rose-200/90">
                    Allergens: {item.allergens.join(", ")}
                  </p>
                ) : null}
                {item.crossContaminationNotes ? (
                  <p className="mt-2 text-xs leading-6 text-amber-200/90">
                    Cross-contamination notice: {item.crossContaminationNotes}
                  </p>
                ) : null}
                <div className="mt-5 flex items-center justify-between gap-3">
                  <span className="text-xs uppercase tracking-[0.18em] text-white/42">Stock: {item.stockQuantity}</span>
                  <button
                    type="button"
                    onClick={() => handleAddToCart(item)}
                    className={[
                      "rounded-full px-4 py-2 text-sm font-semibold transition",
                      inCart
                        ? "bg-white/10 text-white hover:bg-white/14"
                        : "bg-[var(--accent-strong)] text-white shadow-[0_16px_35px_rgba(240,90,40,0.22)] hover:-translate-y-0.5 hover:brightness-105",
                    ].join(" ")}
                  >
                    {inCart
                      ? `In Cart (${cartItems.filter((e) => e.id === item.id).reduce((s, e) => s + e.quantity, 0)})`
                      : item.modifierGroups && item.modifierGroups.length > 0
                        ? "Customise & Add"
                        : "Add to cart"}
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
