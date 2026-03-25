import MenuOrderClient from "@/components/MenuOrderClient";
import { db } from "@/lib/db";

export default async function Home() {
  const items = await db.foodItem.findMany({
    where: { isAvailable: true, stockQuantity: { gt: 0 } },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-8 sm:px-6 lg:px-8">
      <section className="mb-8 rounded-2xl border border-slate-200 bg-gradient-to-r from-red-50 via-amber-50 to-emerald-50 p-6 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-wide text-red-700">United Kingdom Delivery</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">E-Restaurant</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-700 sm:text-base">
          Fresh food, clear GBP pricing, and secure online payment through Shopify checkout.
        </p>
      </section>

      <MenuOrderClient items={items} />
    </main>
  );
}
