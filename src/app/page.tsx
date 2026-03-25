import MenuOrderClient from "@/components/MenuOrderClient";
import { formatGBP } from "@/lib/currency";
import { db } from "@/lib/db";
import Image from "next/image";
import heroImage from "@/assets/hero.png";

export default async function Home() {
  const items = await db.foodItem.findMany({
    where: { isAvailable: true, stockQuantity: { gt: 0 } },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  const featuredItems = items.slice(0, 4);
  const categories = Array.from(new Set(items.map((item) => item.category)));

  return (
    <main className="flex flex-1 flex-col">
      <section className="soft-grid border-b border-white/8">
        <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-18">
          <div className="flex flex-col justify-center">
            <span className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-[var(--cream)]">
              African dishes delivered across the UK
            </span>
            <h1 className="font-heading text-balance text-5xl leading-[0.95] font-semibold text-white sm:text-6xl lg:text-7xl">
              A richer online experience for modern African dining.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-white/72 sm:text-lg">
              Discover signature dishes, clear pricing in GBP, smoother checkout, and an interface
              that feels closer to a premium restaurant brand than a plain catalogue.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href="/menu"
                className="rounded-full bg-[var(--accent-strong)] px-6 py-3 text-sm font-semibold text-white shadow-[0_20px_45px_rgba(240,90,40,0.28)] transition hover:-translate-y-0.5 hover:brightness-105"
              >
                View menu
              </a>
              <a
                href="/about"
                className="rounded-full border border-white/15 bg-white/6 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Learn more
              </a>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <div className="surface-panel rounded-3xl p-4">
                <p className="text-3xl font-semibold text-white">{items.length}</p>
                <p className="mt-1 text-sm text-white/60">Live menu items</p>
              </div>
              <div className="surface-panel rounded-3xl p-4">
                <p className="text-3xl font-semibold text-white">{categories.length}</p>
                <p className="mt-1 text-sm text-white/60">Menu categories</p>
              </div>
              <div className="surface-panel rounded-3xl p-4">
                <p className="text-3xl font-semibold text-white">GBP</p>
                <p className="mt-1 text-sm text-white/60">Clear checkout pricing</p>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-x-8 bottom-0 top-10 rounded-[2rem] bg-[radial-gradient(circle_at_bottom,rgba(127,86,217,0.35),transparent_55%)] blur-3xl" />
            <div className="surface-panel relative overflow-hidden rounded-[2rem] p-3">
              <Image
                src={heroImage}
                alt="Featured restaurant dining presentation"
                priority
                className="h-[460px] w-full rounded-[1.5rem] object-cover"
              />
              <div className="absolute inset-x-8 bottom-8 rounded-[1.5rem] border border-white/12 bg-[rgba(8,17,31,0.78)] p-5 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.24em] text-white/45">Brand direction</p>
                <p className="mt-2 max-w-md text-sm leading-7 text-white/72">
                  The merged sample introduced stronger hero composition, richer section rhythm, and
                  branded card styling. This page now applies that direction to the live ordering flow.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="mb-8 max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--cream)]/70">Why this direction works</p>
          <h2 className="font-heading mt-3 text-3xl text-white sm:text-4xl">Designed to feel like a restaurant brand, not a spreadsheet.</h2>
        </div>
        <div className="grid gap-5 lg:grid-cols-3">
          {[
            {
              title: "Stronger visual hierarchy",
              description: "The sample design uses a hero-led landing page, clearer section sequencing, and more deliberate typography.",
            },
            {
              title: "Better menu discoverability",
              description: "Featured dishes and richer cards make browsing easier before the customer reaches the order form.",
            },
            {
              title: "Production flow preserved",
              description: "The live basket, stock-aware ordering, and Shopify or demo checkout remain intact under the new visual shell.",
            },
          ].map((item) => (
            <article key={item.title} className="surface-panel rounded-[1.75rem] p-6">
              <h3 className="text-xl font-semibold text-white">{item.title}</h3>
              <p className="mt-3 text-sm leading-7 text-white/66">{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="featured" className="border-y border-white/8 bg-black/10">
        <div className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--cream)]/70">Featured dishes</p>
              <h2 className="font-heading mt-3 text-3xl text-white sm:text-4xl">A sample-design style highlight section, now backed by live menu data.</h2>
            </div>
            <a href="#order-section" className="text-sm font-semibold text-[var(--cream)] transition hover:text-white">
              Jump to ordering
            </a>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {featuredItems.map((item) => (
              <article key={item.id} className="surface-panel overflow-hidden rounded-[1.75rem]">
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt={item.name}
                    width={640}
                    height={400}
                    className="h-48 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-48 items-center justify-center bg-[linear-gradient(135deg,rgba(127,86,217,0.22),rgba(240,90,40,0.18))] text-5xl">
                    🍛
                  </div>
                )}

                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.22em] text-white/45">{item.category}</p>
                      <h3 className="mt-2 text-xl font-semibold text-white">{item.name}</h3>
                    </div>
                    <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs font-semibold text-white/72">
                      {formatGBP(item.pricePence)}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-white/66">{item.description}</p>
                  <a
                    href="/menu"
                    className="mt-5 inline-flex rounded-full bg-white/8 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/14"
                  >
                    View on menu
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="mb-8 max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--cream)]/70">Live ordering</p>
          <h2 className="font-heading mt-3 text-3xl text-white sm:text-4xl">Order from the current menu without losing the new visual direction.</h2>
          <p className="mt-4 text-sm leading-7 text-white/66 sm:text-base">
            This section keeps the existing basket and checkout logic, but updates the presentation so the live frontend aligns with the frontend sample that was merged into main.
          </p>
        </div>

        <MenuOrderClient items={items} />
      </section>
    </main>
  );
}
