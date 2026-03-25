import Image from "next/image";
import heroImage from "@/assets/hero.png";

const values = [
  {
    title: "African dishes with clearer storytelling",
    body: "The experience now frames dishes with a stronger brand voice, cleaner navigation, and more premium visual rhythm.",
  },
  {
    title: "Operationally grounded",
    body: "The frontend sits on top of stock-aware ordering, admin notifications, and a real order pipeline rather than static demo data.",
  },
  {
    title: "Built for UK-ready expectations",
    body: "Pricing in GBP, cleaner checkout flow, and delivery-first communication align with the standards you called out for UK, US, and EU storefronts.",
  },
];

export default function AboutPage() {
  return (
    <main className="flex flex-1 flex-col">
      <section className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
        <div className="surface-panel overflow-hidden rounded-[2rem] p-3">
          <Image src={heroImage} alt="Restaurant hero presentation" className="h-full min-h-[460px] w-full rounded-[1.5rem] object-cover" priority />
        </div>

        <div className="flex flex-col justify-center">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--cream)]/70">About the brand</p>
          <h1 className="font-heading mt-3 text-4xl text-white sm:text-5xl">A live restaurant platform shaped by the pictorial sample.</h1>
          <p className="mt-6 text-sm leading-8 text-white/66 sm:text-base">
            This frontend is no longer just a plain ordering utility. It now carries the visual intent of the merged design sample across a real menu, shared cart, and checkout experience inside the production Next.js app.
          </p>

          <div className="mt-8 grid gap-4">
            {values.map((value) => (
              <article key={value.title} className="surface-panel rounded-[1.5rem] p-5">
                <h2 className="text-xl font-semibold text-white">{value.title}</h2>
                <p className="mt-3 text-sm leading-7 text-white/66">{value.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}