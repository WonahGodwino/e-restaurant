import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createShopifyCheckout } from "@/lib/shopify";

interface OrderItemInput {
  menuItemId: number;
  quantity: number;
}

/** POST /api/orders – place a new order and return Shopify checkout URL */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      customerName,
      customerEmail,
      customerPhone,
      deliveryAddress,
      items,
    } = body as {
      customerName: string;
      customerEmail: string;
      customerPhone: string;
      deliveryAddress: string;
      items: OrderItemInput[];
    };

    if (
      !customerName ||
      !customerEmail ||
      !customerPhone ||
      !deliveryAddress ||
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return NextResponse.json(
        { error: "All customer details and at least one item are required." },
        { status: 400 }
      );
    }

    // Validate and price items
    const menuItems = await prisma.menuItem.findMany({
      where: {
        id: { in: items.map((i) => i.menuItemId) },
        available: true,
      },
    });

    if (menuItems.length !== items.length) {
      return NextResponse.json(
        { error: "One or more items are unavailable or do not exist." },
        { status: 400 }
      );
    }

    const priceMap = new Map(menuItems.map((m) => [m.id, m]));
    let totalGbp = 0;
    const orderItemsData = items.map((item) => {
      const menu = priceMap.get(item.menuItemId)!;
      const unitPrice = menu.priceGbp;
      totalGbp += unitPrice * item.quantity;
      return {
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        unitPriceGbp: unitPrice,
      };
    });

    // Create order in DB
    const order = await prisma.order.create({
      data: {
        customerName,
        customerEmail,
        customerPhone,
        deliveryAddress,
        totalGbp,
        status: "pending",
        items: { create: orderItemsData },
      },
      include: { items: true },
    });

    // Build Shopify line items (only for items that have a Shopify variant ID)
    const shopifyLineItems = items
      .map((item) => {
        const menu = priceMap.get(item.menuItemId)!;
        return menu.shopifyVariantId
          ? { variantId: menu.shopifyVariantId, quantity: item.quantity }
          : null;
      })
      .filter(Boolean) as { variantId: string; quantity: number }[];

    let checkoutUrl: string | null = null;

    if (shopifyLineItems.length > 0) {
      // Parse address – expects "Address Line, City, Postcode" format
      const addressParts = deliveryAddress.split(",").map((p) => p.trim());
      const nameParts = customerName.split(" ");

      try {
        checkoutUrl = await createShopifyCheckout(
          shopifyLineItems,
          {
            firstName: nameParts[0] ?? customerName,
            lastName: nameParts.slice(1).join(" ") || "-",
            address1: addressParts[0] ?? deliveryAddress,
            city: addressParts[1] ?? "London",
            country: "United Kingdom",
            zip: addressParts[2] ?? "",
            phone: customerPhone,
          },
          customerEmail
        );
      } catch (shopifyErr) {
        console.error("Shopify checkout creation failed:", shopifyErr);
        // Non-fatal – order is still saved; customer can be redirected to a fallback
      }
    }

    return NextResponse.json(
      { orderId: order.id, totalGbp, checkoutUrl },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to place order." },
      { status: 500 }
    );
  }
}
