import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatGBP } from "@/lib/currency";

interface OrderConfirmationPageProps {
  params: Promise<{ orderId: string }>;
}

export default async function OrderConfirmationPage({
  params,
}: OrderConfirmationPageProps) {
  const { orderId } = await params;

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

  const isPaid = order.status === "PAID";
  const isFailed = order.status === "FAILED";
  const isPending = order.status === "PENDING_PAYMENT";
  // An order without a Shopify checkout URL was placed without a payment
  // provider (internal / demo mode).
  const isInternalOrder = !order.shopifyCheckoutUrl;

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-10 sm:px-6 lg:px-8">
      <section className="surface-panel rounded-[2rem] p-8 sm:p-10">
        <div className="mb-8 flex flex-col gap-4 border-b border-white/10 pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--cream)]/70">
              Order received
            </p>
            <h1 className="font-heading mt-3 text-4xl text-white sm:text-5xl">
              {isFailed ? "Payment Failed" : isPaid ? "Payment Confirmed" : "Order Created"}
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-8 text-white/66 sm:text-base">
              {isFailed
                ? "Unfortunately your payment could not be processed. Your order has been cancelled and no charge has been made. Please try placing a new order, or contact us if you need help."
                : isPaid
                  ? "Your payment was successful and the kitchen has been notified. Thank you for your order!"
                  : isInternalOrder
                    ? "Your order has been recorded and the kitchen workflow has been notified."
                    : "Your order is awaiting payment. Complete your payment through the checkout link you were redirected to. Once payment is confirmed, the kitchen will be notified."}
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-white/10 bg-white/4 px-5 py-4 text-sm text-white/72">
            <div className="flex items-center justify-between gap-6">
              <span>Order ID</span>
              <span className="font-mono text-[var(--cream)]">{order.id}</span>
            </div>
            <div className="mt-3 flex items-center justify-between gap-6 border-t border-white/10 pt-3">
              <span>Status</span>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${
                  isFailed
                    ? "bg-red-500/15 text-red-300"
                    : isPaid
                      ? "bg-emerald-500/15 text-emerald-300"
                      : "bg-amber-500/15 text-amber-300"
                }`}
              >
                {String(order.status).replaceAll("_", " ")}
              </span>
            </div>
          </div>
        </div>

        {isFailed ? (
          <div className="mb-8 rounded-[1.5rem] border border-red-500/20 bg-red-500/8 p-6">
            <h2 className="text-lg font-semibold text-red-300">What happened?</h2>
            <p className="mt-3 text-sm leading-7 text-white/66">
              Your payment was declined or the checkout session expired before payment was
              completed. Your items have been returned to stock and no charge has been made to
              your account.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/checkout"
                className="rounded-full bg-[var(--accent-strong)] px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_35px_rgba(240,90,40,0.22)]"
              >
                Try again
              </Link>
              <Link
                href="/contact"
                className="rounded-full border border-white/10 bg-white/6 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Contact support
              </Link>
            </div>
          </div>
        ) : null}

        {isPending && !isInternalOrder ? (
          <div className="mb-8 rounded-[1.5rem] border border-amber-500/20 bg-amber-500/8 p-6">
            <h2 className="text-lg font-semibold text-amber-300">Payment pending</h2>
            <p className="mt-3 text-sm leading-7 text-white/66">
              Your order has been reserved but payment has not been confirmed yet. If you
              completed payment on the Shopify checkout page, your order status will update
              shortly. If you need to complete payment, please use the link in your confirmation
              email.
            </p>
            {order.shopifyCheckoutUrl ? (
              <a
                href={order.shopifyCheckoutUrl}
                className="mt-4 inline-block rounded-full bg-[var(--accent-strong)] px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_35px_rgba(240,90,40,0.22)]"
              >
                Complete payment
              </a>
            ) : null}
          </div>
        ) : null}

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
              <h2 className="text-2xl font-semibold text-white">Delivery</h2>
              <p className="mt-4 text-sm leading-8 text-white/66">{order.deliveryAddress}</p>
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
                <div className="flex items-center justify-between border-t border-white/10 pt-3 text-base font-semibold text-white">
                  <span>Total</span>
                  <span>{formatGBP(order.totalPence)}</span>
                </div>
              </div>
            </div>

            {!isFailed ? (
              <div className="rounded-[1.5rem] border border-white/8 bg-white/4 p-6 text-sm leading-8 text-white/66">
                <h2 className="text-2xl font-semibold text-white">What happens next</h2>
                <p className="mt-4">
                  {isPaid || isInternalOrder
                    ? "The restaurant has been notified and the kitchen can begin handling fulfilment."
                    : "Once your payment is confirmed, the restaurant will be notified and the kitchen will begin preparing your order. If you need help, use the contact page and include your order ID."}
                </p>
              </div>
            ) : null}

            <div className="flex flex-wrap gap-3">
              {!isFailed ? (
                <Link href="/menu" className="rounded-full bg-[var(--accent-strong)] px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_35px_rgba(240,90,40,0.22)]">
                  Order more dishes
                </Link>
              ) : null}
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