import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { topUpStockSchema } from "@/lib/validators";
import { logAuditEvent, getActorFromKey } from "@/lib/audit";

function isAdminAuthorized(request: NextRequest): boolean {
  const key = request.headers.get("x-admin-key");
  const expected = process.env.ADMIN_DASHBOARD_KEY ?? process.env.ADMIN_API_KEY;
  return Boolean(expected) && key === expected;
}

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = await request.json();
  const parsed = topUpStockSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const item = await db.foodItem.update({
    where: { id },
    data: {
      stockQuantity: {
        increment: parsed.data.quantityToAdd,
      },
    },
  });

  const actor = getActorFromKey(request.headers.get("x-admin-key"));
  void logAuditEvent(actor, "stock.topup", `FoodItem:${id}`, {
    quantityAdded: parsed.data.quantityToAdd,
    newStock: item.stockQuantity,
  });

  return NextResponse.json({ item });
}
