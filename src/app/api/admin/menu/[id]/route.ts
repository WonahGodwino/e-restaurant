import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { updateFoodItemSchema } from "@/lib/validators";
import { logAuditEvent, getActorFromKey } from "@/lib/audit";

function isAdminAuthorized(request: NextRequest): boolean {
  const key = request.headers.get("x-admin-key");
  const expected = process.env.ADMIN_DASHBOARD_KEY;
  return Boolean(expected) && key === expected;
}

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = await request.json();
  const parsed = updateFoodItemSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const input = parsed.data;

  const item = await db.foodItem.update({
    where: { id },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.category !== undefined ? { category: input.category } : {}),
      ...(input.pricePence !== undefined ? { pricePence: input.pricePence } : {}),
      ...(input.stockQuantity !== undefined ? { stockQuantity: input.stockQuantity } : {}),
      ...(input.allergens !== undefined ? { allergens: input.allergens } : {}),
      ...(input.dietaryTags !== undefined ? { dietaryTags: input.dietaryTags } : {}),
      ...(input.crossContaminationNotes !== undefined
        ? { crossContaminationNotes: input.crossContaminationNotes || null }
        : {}),
      ...(input.imageUrl !== undefined ? { imageUrl: input.imageUrl || null } : {}),
      ...(input.shopifyVariantId !== undefined
        ? { shopifyVariantId: input.shopifyVariantId || null }
        : {}),
      ...(input.isAvailable !== undefined ? { isAvailable: input.isAvailable } : {}),
    },
  });

  const actor = getActorFromKey(request.headers.get("x-admin-key"));
  void logAuditEvent(actor, "menu.update", `FoodItem:${id}`, input as Record<string, unknown>);

  return NextResponse.json({ item });
}
