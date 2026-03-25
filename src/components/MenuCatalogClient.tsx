"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useCart } from "@/components/CartProvider";
import { formatGBP } from "@/lib/currency";
import type { MenuItem } from "@/types";

export default function MenuCatalogClient({ items }: { items: MenuItem[] }) {
  const [activeCategory, setActiveCategory] = useState("All");
  const { addItem, items: cartItems } = useCart();

  const categories = useMemo(() => ["All", ...Array.from(new Set(items.map((item) => item.category)))], [items]);

  const filtered = useMemo(() => {
    return activeCategory === "All"
      ? items
      : items.filter((item) => item.category === activeCategory);
  }, [activeCategory, items]);

  return (
    <div className="space-y-8">
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
                    onClick={() => addItem(item)}
                    className={[
                      "rounded-full px-4 py-2 text-sm font-semibold transition",
                      inCart
                        ? "bg-white/10 text-white hover:bg-white/14"
                        : "bg-[var(--accent-strong)] text-white shadow-[0_16px_35px_rgba(240,90,40,0.22)] hover:-translate-y-0.5 hover:brightness-105",
                    ].join(" ")}
                  >
                    {inCart ? `In Cart (${inCart.quantity})` : "Add to cart"}
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