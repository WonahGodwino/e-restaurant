import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createShopifyCart } from "@/lib/shopify";
import { createOrderSchema } from "@/lib/validators";
import { notifyAllAdminsAndCooks } from "@/lib/notifications";
import {
  sendEmail,
  generateCustomerOrderConfirmationEmailTemplate,
  generateNewOrderEmailTemplate,
} from "@/lib/email";
import { evaluateDeliveryQuote } from "@/lib/delivery-zones";

function getPublicBaseUrl(request: NextRequest): string {
  const configured = process.env.APP_BASE_URL?.trim();
  if (configured) {
    return configured.replace(/\/$/, "");
  }

  return request.nextUrl.origin.replace(/\/$/, "");
}

function isShopifyConfigured() {
  const storeDomain = process.env.SHOPIFY_STORE_DOMAIN;
  const storefrontToken = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;

  if (!storeDomain || !storefrontToken) {
    return false;
  }

  if (storeDomain.includes("your-store.myshopify.com")) {
    return false;
  }

  if (storefrontToken.includes("your-storefront-access-token")) {
    return false;
  }

  return true;
}

export async function GET() {
  return NextResponse.json({
    isDemo: !isShopifyConfigured(),
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = createOrderSchema.safeParse(body);

  const input = parsed.success
    ? parsed.data
    : (() => {
        // In development, allow a demo fallback so ordering flow can be tested
        // even when the request payload is incomplete.
        if (process.env.NODE_ENV === "production") {
          return null;
        }

        const source = body as {
          customerName?: unknown;
          customerEmail?: unknown;
          customerPhone?: unknown;
          fulfillmentType?: unknown;
          deliveryPostcode?: unknown;
          deliveryAddress?: unknown;
          notes?: unknown;
          items?: unknown;
        };

        const rawItems = Array.isArray(source.items) ? source.items : [];
        const items = rawItems
          .map((item) => {
            if (!item || typeof item !== "object") {
              return null;
            }
            const candidate = item as { foodItemId?: unknown; quantity?: unknown };
            const foodItemId =
              typeof candidate.foodItemId === "string" ? candidate.foodItemId : "";
            const quantity = Number(candidate.quantity);

            if (!foodItemId || !Number.isFinite(quantity) || quantity < 1) {
              return null;
            }

            return {
              foodItemId,
              quantity: Math.floor(quantity),
              selectedModifiers: [] as { modifierId: string; modifierName: string; groupName: string; priceDeltaPence: number; }[],
            };
          })
          .filter((item): item is { foodItemId: string; quantity: number; selectedModifiers: { modifierId: string; modifierName: string; groupName: string; priceDeltaPence: number; }[] } => item !== null);

        if (items.length === 0) {
          return null;
        }

        const customerName =
          typeof source.customerName === "string" && source.customerName.trim()
            ? source.customerName.trim()
            : "Demo Customer";

        const customerEmail =
          typeof source.customerEmail === "string" && source.customerEmail.includes("@")
            ? source.customerEmail.trim()
            : "demo@example.com";

        const fulfillmentType = source.fulfillmentType === "PICKUP" ? "PICKUP" : "DELIVERY";
        const deliveryPostcode =
          fulfillmentType === "DELIVERY" &&
          typeof source.deliveryPostcode === "string" &&
          source.deliveryPostcode.trim()
            ? source.deliveryPostcode.trim()
            : "";

        const deliveryAddress =
          fulfillmentType === "DELIVERY"
            ? typeof source.deliveryAddress === "string" && source.deliveryAddress.trim()
              ? source.deliveryAddress.trim()
              : "Demo Address"
            : "";

        const customerPhone =
          typeof source.customerPhone === "string" && source.customerPhone.trim()
            ? source.customerPhone.trim()
            : "";

        const notes =
          typeof source.notes === "string" && source.notes.trim()
            ? source.notes.trim()
            : "Demo mode fallback order (validation bypassed in development).";

        return {
          customerName,
          customerEmail,
          customerPhone,
          fulfillmentType,
          deliveryPostcode,
          deliveryAddress,
          notes,
          items,
        };
      })();

  if (!input) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.success ? undefined : parsed.error.flatten() },
      { status: 400 },
    );
  }
  const itemIds = input.items.map((item) => item.foodItemId);

  const menuItems = await db.foodItem.findMany({
    where: {
      id: { in: itemIds },
      isAvailable: true,
      stockQuantity: { gt: 0 },
    },
  });

  const menuMap = new Map(menuItems.map((item) => [item.id, item]));
  const missing = input.items.filter((line) => !menuMap.has(line.foodItemId));

  if (missing.length > 0) {
    return NextResponse.json(
      { error: "One or more items are unavailable." },
      { status: 400 },
    );
  }

  const lines = input.items.map((line) => {
    const item = menuMap.get(line.foodItemId)!;
    const modifierDeltaPence = (line.selectedModifiers ?? []).reduce(
      (sum, mod) => sum + mod.priceDeltaPence,
      0,
    );
    const unitPricePence = item.pricePence + modifierDeltaPence;
    return {
      foodItemId: item.id,
      quantity: line.quantity,
      unitPricePence,
      lineTotalPence: unitPricePence * line.quantity,
      itemName: item.name,
      shopifyVariantId: item.shopifyVariantId,
      selectedModifiers: line.selectedModifiers ?? [],
    };
  });

  const outOfStock = lines.filter((line) => {
    const item = menuMap.get(line.foodItemId)!;
    return item.stockQuantity < line.quantity;
  });

  if (outOfStock.length > 0) {
    return NextResponse.json(
      { error: "Some items do not have enough stock available." },
      { status: 409 },
    );
  }

  const subtotalPence = lines.reduce((sum, line) => sum + line.lineTotalPence, 0);

  let deliveryFeePence = 0;
  let deliveryZoneName: string | null = null;

  if (input.fulfillmentType === "DELIVERY") {
    const quote = evaluateDeliveryQuote(subtotalPence, input.deliveryPostcode || "");
    if (!quote.serviceable) {
      return NextResponse.json(
        { error: quote.reason ?? "Delivery is not available for this postcode." },
        { status: 400 },
      );
    }

    deliveryFeePence = quote.deliveryFeePence;
    deliveryZoneName = quote.zoneName || null;
  }

  const totalPence = subtotalPence + deliveryFeePence;

  // Attempt Shopify checkout creation when provider is configured.
  // When Shopify is configured, a successful cart creation is required before
  // persisting the order so that stock is never decremented without a valid
  // payment URL (prevents inconsistent order state).
  let shopifyCartId: string | null = null;
  let shopifyCheckoutUrl: string | null = null;

  if (isShopifyConfigured()) {
    const itemsWithVariants = lines.filter((line) => line.shopifyVariantId);

    if (itemsWithVariants.length === 0) {
      console.error(
        "[Payment] Shopify is configured but none of the ordered items have a shopifyVariantId. " +
          "Assign variant IDs to all menu items in the admin panel.",
      );
      return NextResponse.json(
        { error: "Payment checkout is currently unavailable. Please contact support." },
        { status: 503 },
      );
    }

    console.info(
      `[Payment] Attempting Shopify cart creation for order (${itemsWithVariants.length} line(s))`,
    );

    try {
      const cart = await createShopifyCart(
        itemsWithVariants.map((line) => ({
          merchandiseId: line.shopifyVariantId!,
          quantity: line.quantity,
        })),
      );
      shopifyCartId = cart.cartId;
      shopifyCheckoutUrl = cart.checkoutUrl;
      console.info(`[Payment] Shopify cart created successfully: ${shopifyCartId}`);
    } catch (shopifyError) {
      console.error("[Payment] Shopify cart creation failed:", shopifyError);
      return NextResponse.json(
        { error: "Payment service is temporarily unavailable. Please try again shortly." },
        { status: 502 },
      );
    }
  }

  try {
    const order = await db.$transaction(async (tx) => {
      for (const line of lines) {
        const updated = await tx.foodItem.updateMany({
          where: {
            id: line.foodItemId,
            isAvailable: true,
            stockQuantity: { gte: line.quantity },
          },
          data: {
            stockQuantity: {
              decrement: line.quantity,
            },
          },
        });

        if (updated.count === 0) {
          throw new Error("Stock changed while placing order. Please review your basket.");
        }
      }

      return tx.order.create({
        data: {
          customerName: input.customerName,
          customerEmail: input.customerEmail,
          customerPhone: input.customerPhone || null,
          fulfillmentType: input.fulfillmentType === "PICKUP" ? "PICKUP" : "DELIVERY",
          deliveryPostcode: input.fulfillmentType === "DELIVERY" ? input.deliveryPostcode || null : null,
          deliveryZoneName,
          deliveryAddress: input.fulfillmentType === "DELIVERY" ? input.deliveryAddress || null : null,
          deliveryFeePence,
          notes: input.notes || null,
          totalPence,
          shopifyCartId,
          shopifyCheckoutUrl,
          items: {
            create: lines.map((line) => ({
              foodItemId: line.foodItemId,
              itemName: line.itemName,
              unitPricePence: line.unitPricePence,
              quantity: line.quantity,
              lineTotalPence: line.lineTotalPence,
              modifiers: line.selectedModifiers.length > 0
                ? {
                    create: line.selectedModifiers.map((mod) => ({
                      modifierId: mod.modifierId,
                      modifierName: mod.modifierName,
                      groupName: mod.groupName,
                      priceDeltaPence: mod.priceDeltaPence,
                    })),
                  }
                : undefined,
            })),
          },
        },
      });
    });

    // Send notifications to admins, cooks, and managers (in background)
    // Don't await so response isn't delayed
    notifyAllAdminsAndCooks(
      'NEW_ORDER',
      `New Order #${order.id}`,
      `New order from ${input.customerName} for £${(totalPence / 100).toFixed(2)}`,
      undefined,
      order.id
    ).catch((err) => console.error('Failed to send order notifications:', err));

    // Also format and send email with order details to admins and customer
    const formattedTotal = `£${(totalPence / 100).toFixed(2)}`;
    const confirmationPath = `/order-confirmation/${order.id}`;
    const baseUrl = getPublicBaseUrl(request);
    const confirmationUrl = `${baseUrl}${confirmationPath}`;
    const statusUrl = `${baseUrl}/order-status`;

    const emailHtml = generateNewOrderEmailTemplate(
      order.id,
      input.customerName,
      lines.map((line) => ({
        name: line.itemName,
        quantity: line.quantity,
        price: `£${(line.unitPricePence / 100).toFixed(2)}`,
      })),
      formattedTotal,
      input.fulfillmentType === "DELIVERY"
        ? input.deliveryAddress || "No delivery address provided"
        : "Pickup order"
    );

    const customerEmailHtml = generateCustomerOrderConfirmationEmailTemplate(
      order.id,
      input.customerName,
      lines.map((line) => ({
        name: line.itemName,
        quantity: line.quantity,
        price: `£${(line.unitPricePence / 100).toFixed(2)}`,
      })),
      formattedTotal,
      confirmationUrl,
      statusUrl,
    );

    // Get admin emails and send notification emails
    db.user
      .findMany({
        where: { role: { in: ['ADMIN', 'COOK', 'MANAGER'] }, isActive: true },
      })
      .then((users) => {
        users.forEach((user) => {
          if (user.email) {
            sendEmail({
              to: user.email,
              subject: `📦 New Order #${order.id}`,
              html: emailHtml,
            }).catch((err) => console.error('Email send failed:', err));
          }
        });
      })
      .catch((err) => console.error('Failed to fetch users for email:', err));

    sendEmail({
      to: input.customerEmail,
      subject: `Your order #${order.id} confirmation`,
      html: customerEmailHtml,
      text: [
        `Thanks for your order, ${input.customerName}.`,
        `Order ID: ${order.id}`,
        `Total: ${formattedTotal}`,
        `Confirmation: ${confirmationUrl}`,
        `Track status: ${statusUrl}`,
      ].join("\n"),
    }).catch((err) => console.error('Customer confirmation email failed:', err));

    console.info(`[Payment] Order ${order.id} created successfully (shopifyCartId=${shopifyCartId ?? "none"})`);

    return NextResponse.json(
      {
        orderId: order.id,
        checkoutUrl: shopifyCheckoutUrl || `/order-confirmation/${order.id}`,
        isDemo: !shopifyCheckoutUrl,
      },
      { status: 201 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not create order";
    console.error("[Payment] Order creation failed:", error);
    if (message.includes("Stock changed while placing order")) {
      return NextResponse.json({ error: message }, { status: 409 });
    }
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
