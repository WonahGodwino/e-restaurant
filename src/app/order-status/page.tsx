import OrderStatusLookupClient from "@/components/OrderStatusLookupClient";

export default function OrderStatusPage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-12 sm:px-6 lg:px-8">
      <section className="mb-10 max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--cream)]/70">Order support</p>
        <h1 className="font-heading mt-3 text-4xl text-white sm:text-5xl">Track Your Order</h1>
        <p className="mt-4 text-sm leading-7 text-white/66 sm:text-base">
          Use your order ID and checkout email to view your latest order status and summary.
        </p>
      </section>

      <OrderStatusLookupClient />
    </main>
  );
}