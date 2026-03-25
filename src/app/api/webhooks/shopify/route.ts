import { createHmac, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * Verify the HMAC-SHA256 signature that Shopify sends with every webhook.
 * Returns true when the signature is valid and the secret is configured.
 */
async function verifyShopifyWebhook(request: NextRequest, rawBody: Buffer): Promise<boolean> {
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[Webhook] SHOPIFY_WEBHOOK_SECRET is not set — cannot verify signature.");
    return false;
  }

  const shopifyHmac = request.headers.get("x-shopify-hmac-sha256");
  if (!shopifyHmac) {
    return false;
  }

  const digest = createHmac("sha256", secret).update(rawBody).digest("base64");

  try {
    return timingSafeEqual(Buffer.from(digest), Buffer.from(shopifyHmac));
  } catch {
    return false;
  }
}

type ShopifyWebhookPayload = {
  cart_token?: string | null;
  token?: string | null;
};

/**
 * POST /api/webhooks/shopify
 *
 * Receives webhook events from Shopify and keeps our order records consistent.
 *
 * Handled topics:
 *   orders/paid        → mark order PAID
 *   orders/cancelled   → mark order FAILED, restore stock
 *   checkouts/delete   → mark order FAILED, restore stock (abandoned checkout)
 */
export async function POST(request: NextRequest) {
  const topic = request.headers.get("x-shopify-topic") ?? "";

  // Read the raw body bytes for HMAC verification before parsing JSON.
  const rawBodyBuffer = Buffer.from(await request.arrayBuffer());

  const isValid = await verifyShopifyWebhook(request, rawBodyBuffer);
  if (!isValid) {
    console.error(`[Webhook] Rejected ${topic} request — invalid or missing HMAC signature.`);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: ShopifyWebhookPayload;
  try {
    payload = JSON.parse(rawBodyBuffer.toString("utf-8")) as ShopifyWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Extract the cart token from the payload (field name differs by topic).
  const cartToken =
    typeof payload.cart_token === "string" && payload.cart_token
      ? payload.cart_token
      : typeof payload.token === "string" && payload.token
        ? payload.token
        : null;

  if (!cartToken) {
    // Some webhook topics don't carry a cart token — acknowledge and move on.
    console.info(`[Webhook] ${topic}: no cart_token in payload, nothing to update.`);
    return NextResponse.json({ received: true });
  }

  // Find our order by matching the cart token embedded in the stored Shopify GID
  // (e.g. "gid://shopify/Cart/TOKEN" contains "TOKEN").
  const order = await db.order.findFirst({
    where: {
      shopifyCartId: { contains: cartToken },
    },
  });

  if (!order) {
    // Not every Shopify event originates from an order we track.
    console.info(`[Webhook] ${topic}: no matching order found for cart token ${cartToken}.`);
    return NextResponse.json({ received: true });
  }

  console.info(`[Webhook] ${topic}: matched order ${order.id} (status=${order.status}).`);

  if (topic === "orders/paid") {
    if (order.status !== "PAID") {
      await db.order.update({
        where: { id: order.id },
        data: { status: "PAID" },
      });
      console.info(`[Webhook] Order ${order.id} marked PAID.`);
    }
    return NextResponse.json({ received: true });
  }

  if (topic === "orders/cancelled" || topic === "checkouts/delete") {
    if (order.status === "PENDING_PAYMENT") {
      await db.$transaction(async (tx) => {
        await tx.order.update({
          where: { id: order.id },
          data: { status: "FAILED" },
        });

        // Restore stock so the items become available for future orders.
        const items = await tx.orderItem.findMany({
          where: { orderId: order.id },
        });
        for (const item of items) {
          await tx.foodItem.update({
            where: { id: item.foodItemId },
            data: { stockQuantity: { increment: item.quantity } },
          });
        }
      });
      console.info(`[Webhook] Order ${order.id} marked FAILED and stock restored.`);
    }
    return NextResponse.json({ received: true });
  }

  // Unhandled topic — acknowledge without action.
  console.info(`[Webhook] Unhandled topic: ${topic}.`);
  return NextResponse.json({ received: true });
}
