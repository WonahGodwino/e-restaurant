import { NextRequest, NextResponse } from "next/server";
import { evaluateDeliveryQuote } from "@/lib/delivery-zones";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      subtotalPence?: unknown;
      postcode?: unknown;
      fulfillmentType?: unknown;
    };

    const subtotalPence = Math.round(Number(body.subtotalPence));
    if (!Number.isFinite(subtotalPence) || subtotalPence < 0) {
      return NextResponse.json({ error: "subtotalPence must be a non-negative number." }, { status: 400 });
    }

    const fulfillmentType = body.fulfillmentType === "PICKUP" ? "PICKUP" : "DELIVERY";
    if (fulfillmentType === "PICKUP") {
      return NextResponse.json({
        serviceable: true,
        zoneName: "Pickup",
        deliveryFeePence: 0,
        minOrderPence: 0,
        totalPence: subtotalPence,
      });
    }

    const postcode = typeof body.postcode === "string" ? body.postcode.trim() : "";
    if (!postcode) {
      return NextResponse.json({ error: "postcode is required for delivery quotes." }, { status: 400 });
    }

    return NextResponse.json(evaluateDeliveryQuote(subtotalPence, postcode));
  } catch {
    return NextResponse.json({ error: "Could not calculate delivery quote." }, { status: 500 });
  }
}
