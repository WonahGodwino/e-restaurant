import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createShopifyCart } from "@/lib/shopify";
import { createOrderSchema } from "@/lib/validators";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = createOrderSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const input = parsed.data;
  const itemIds = input.items.map((item) => item.foodItemId);

  const menuItems = await db.foodItem.findMany({
    where: {
      id: { in: itemIds },
      isAvailable: true,
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
    return {
      foodItemId: item.id,
      quantity: line.quantity,
      unitPricePence: item.pricePence,
      lineTotalPence: item.pricePence * line.quantity,
      itemName: item.name,
      shopifyVariantId: item.shopifyVariantId,
    };
  });

  const withoutVariant = lines.filter((line) => !line.shopifyVariantId);
  if (withoutVariant.length > 0) {
    return NextResponse.json(
      {
        error:
          "Some items cannot be paid for yet because Shopify variant IDs are missing. Please contact support.",
      },
      { status: 400 },
    );
  }

  const totalPence = lines.reduce((sum, line) => sum + line.lineTotalPence, 0);

  try {
    const cart = await createShopifyCart(
      lines.map((line) => ({
        merchandiseId: line.shopifyVariantId!,
        quantity: line.quantity,
      })),
    );

    const order = await db.order.create({
      data: {
        customerName: input.customerName,
        customerEmail: input.customerEmail,
        customerPhone: input.customerPhone || null,
        deliveryAddress: input.deliveryAddress,
        notes: input.notes || null,
        totalPence,
        shopifyCartId: cart.cartId,
        shopifyCheckoutUrl: cart.checkoutUrl,
        items: {
          create: lines.map((line) => ({
            foodItemId: line.foodItemId,
            itemName: line.itemName,
            unitPricePence: line.unitPricePence,
            quantity: line.quantity,
            lineTotalPence: line.lineTotalPence,
          })),
        },
      },
    });

    return NextResponse.json(
      {
        orderId: order.id,
        checkoutUrl: cart.checkoutUrl,
      },
      { status: 201 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not create checkout";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
