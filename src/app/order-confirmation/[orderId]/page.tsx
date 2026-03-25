import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatGBP } from "@/lib/currency";

interface OrderConfirmationPageProps {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<{ mode?: string }>;
}

export default async function OrderConfirmationPage({
  params,
  searchParams,
}: OrderConfirmationPageProps) {
  const { orderId } = await params;
  const { mode } = await searchParams;

  const order = await db.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!order) {
    notFound();
  }

  const isDemo = mode === "demo" || !order.shopifyCheckoutUrl;

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-10 sm:px-6 lg:px-8">
      <section className="surface-panel rounded-[2rem] p-8 sm:p-10">
        <div className="mb-8 flex flex-col gap-4 border-b border-white/10 pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--cream)]/70">
              Order received
            </p>
            <h1 className="font-heading mt-3 text-4xl text-white sm:text-5xl">
              {isDemo ? "Order Confirmed" : "Order Created"}
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-8 text-white/66 sm:text-base">
              {isDemo
                ? "Your order has been recorded and the kitchen workflow has been notified."
                : "Your order has been created. Complete payment through the checkout link if you were redirected from an external payment flow."}
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-white/10 bg-white/4 px-5 py-4 text-sm text-white/72">
            <div className="flex items-center justify-between gap-6">
              <span>Order ID</span>
              <span className="font-mono text-[var(--cream)]">{order.id}</span>
            </div>
            <div className="mt-3 flex items-center justify-between gap-6 border-t border-white/10 pt-3">
              <span>Status</span>
              <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-300">
                {String(order.status).replaceAll("_", " ")}
              </span>
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.35fr_0.95fr]">
          <section className="space-y-4">
            <div className="rounded-[1.5rem] border border-white/8 bg-white/4 p-6">
              <h2 className="text-2xl font-semibold text-white">Order details</h2>
              <div className="mt-5 space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-start justify-between gap-3 rounded-2xl border border-white/8 bg-[rgba(255,255,255,0.03)] p-4 text-sm">
                    <div>
                      <p className="font-medium text-white">{item.itemName}</p>
                      <p className="text-white/50">x{item.quantity}</p>
                    </div>
                    <span className="font-medium text-white">{formatGBP(item.lineTotalPence)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-white/8 bg-white/4 p-6">
              <h2 className="text-2xl font-semibold text-white">Fulfilment</h2>
              <p className="mt-4 text-sm leading-8 text-white/66">
                {order.fulfillmentType === "DELIVERY" ? "Delivery" : "Pickup"}
              </p>
              {order.fulfillmentType === "DELIVERY" && order.deliveryAddress ? (
                <>
                  {order.deliveryZoneName ? (
                    <p className="text-sm leading-8 text-white/66">Zone: {order.deliveryZoneName}</p>
                  ) : null}
                  {order.deliveryPostcode ? (
                    <p className="text-sm leading-8 text-white/66">Postcode: {order.deliveryPostcode}</p>
                  ) : null}
                  <p className="text-sm leading-8 text-white/66">{order.deliveryAddress}</p>
                </>
              ) : (
                <p className="text-sm leading-8 text-white/66">Collect from restaurant location.</p>
              )}
              {order.notes ? (
                <p className="mt-4 text-sm leading-8 text-white/60">Notes: {order.notes}</p>
              ) : null}
            </div>
          </section>

          <aside className="space-y-4">
            <div className="rounded-[1.5rem] border border-white/8 bg-white/4 p-6">
              <h2 className="text-2xl font-semibold text-white">Summary</h2>
              <div className="mt-5 space-y-3 text-sm text-white/68">
                <div className="flex items-center justify-between">
                  <span>Customer</span>
                  <span>{order.customerName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Email</span>
                  <span>{order.customerEmail}</span>
                </div>
                {order.customerPhone ? (
                  <div className="flex items-center justify-between">
                    <span>Phone</span>
                    <span>{order.customerPhone}</span>
                  </div>
                ) : null}
                <div className="flex items-center justify-between">
                  <span>Fulfilment</span>
                  <span>{order.fulfillmentType === "DELIVERY" ? "Delivery" : "Pickup"}</span>
                </div>
                {order.deliveryFeePence > 0 ? (
                  <div className="flex items-center justify-between">
                    <span>Delivery fee</span>
                    <span>{formatGBP(order.deliveryFeePence)}</span>
                  </div>
                ) : null}
                <div className="flex items-center justify-between border-t border-white/10 pt-3 text-base font-semibold text-white">
                  <span>Total</span>
                  <span>{formatGBP(order.totalPence)}</span>
                </div>
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-white/8 bg-white/4 p-6 text-sm leading-8 text-white/66">
              <h2 className="text-2xl font-semibold text-white">What happens next</h2>
              <p className="mt-4">
                {isDemo
                  ? "This order used the internal fallback path. Staff notifications have already been triggered, so the kitchen can begin handling fulfilment."
                  : "If payment has completed, the restaurant can continue fulfilment. If you still need help with payment or delivery, use the contact page and include your order ID."}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href="/menu" className="rounded-full bg-[var(--accent-strong)] px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_35px_rgba(240,90,40,0.22)]">
                Order more dishes
              </Link>
              <Link href="/contact" className="rounded-full border border-white/10 bg-white/6 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
                Contact support
              </Link>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}