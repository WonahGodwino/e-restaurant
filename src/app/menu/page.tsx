import MenuCatalogClient from "@/components/MenuCatalogClient";
import { db } from "@/lib/db";

export default async function MenuPage() {
  const items = await db.foodItem.findMany({
    where: { isAvailable: true, stockQuantity: { gt: 0 } },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-12 sm:px-6 lg:px-8">
      <section className="mb-10 max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--cream)]/70">Our kitchen lineup</p>
        <h1 className="font-heading mt-3 text-4xl text-white sm:text-5xl">Menu</h1>
        <p className="mt-4 text-sm leading-7 text-white/66 sm:text-base">
          Explore the live catalogue with category filtering, richer dish cards, and a shared cart that carries through to checkout.
        </p>
      </section>

      <MenuCatalogClient items={items} />
    </main>
  );
}