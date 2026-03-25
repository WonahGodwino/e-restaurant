import Link from "next/link";

interface DemoCheckoutPageProps {
  searchParams: Promise<{ orderId: string }>;
}

export default async function DemoCheckoutPage({
  searchParams,
}: DemoCheckoutPageProps) {
  const { orderId } = await searchParams;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-8 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-orange-200 bg-orange-50 p-8 text-center">
        <div className="mb-4 text-5xl">🎉</div>
        <h1 className="mb-2 text-3xl font-bold text-orange-900">Demo Mode: Order Confirmed!</h1>
        <p className="mb-6 text-base text-orange-800">
          Your order has been successfully placed and the kitchen has been notified.
        </p>

        <div className="mb-8 rounded-lg bg-white p-6 text-left">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Order Details</h2>
          <div className="space-y-2 text-sm text-slate-700">
            <div className="flex justify-between">
              <span className="font-medium">Order ID:</span>
              <span className="font-mono text-orange-600">{orderId}</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-2">
              <span className="font-medium">Status:</span>
              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
                ✓ Confirmed
              </span>
            </div>
            <p className="mt-4 text-xs text-slate-600">
              <strong>Note:</strong> This is demo mode. In production, a real payment checkout link would appear here.
              The kitchen staff have been notified and will start preparing your order.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <Link
            href="/"
            className="inline-block rounded-lg bg-orange-600 px-6 py-3 font-semibold text-white hover:bg-orange-700"
          >
            ← Back to Menu
          </Link>
          <p className="text-xs text-slate-600">
            Questions? Contact us directly for order status updates.
          </p>
        </div>
      </div>
    </main>
  );
}
