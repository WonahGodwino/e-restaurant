import { redirect } from "next/navigation";

interface DemoCheckoutPageProps {
  searchParams: Promise<{ orderId: string }>;
}

export default async function DemoCheckoutPage({
  searchParams,
}: DemoCheckoutPageProps) {
  const { orderId } = await searchParams;

  redirect(`/order-confirmation/${orderId}?mode=demo`);
}
