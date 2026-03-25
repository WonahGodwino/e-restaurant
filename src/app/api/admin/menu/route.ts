import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createFoodItemSchema } from "@/lib/validators";

function isAdminAuthorized(request: NextRequest): boolean {
  const key = request.headers.get("x-admin-key");
  const expected = process.env.ADMIN_DASHBOARD_KEY;
  return Boolean(expected) && key === expected;
}

export async function GET(request: NextRequest) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const items = await db.foodItem.findMany({
    orderBy: [{ category: "asc" }, { name: "asc" }],
    include: {
      modifierGroups: {
        orderBy: { displayOrder: "asc" },
        include: {
          modifiers: {
            orderBy: { displayOrder: "asc" },
          },
        },
      },
    },
  });

  return NextResponse.json({ items });
}

export async function POST(request: NextRequest) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createFoodItemSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const input = parsed.data;
  const item = await db.foodItem.create({
    data: {
      name: input.name,
      description: input.description,
      category: input.category,
      pricePence: input.pricePence,
      stockQuantity: input.stockQuantity,
      allergens: input.allergens,
      dietaryTags: input.dietaryTags,
      crossContaminationNotes: input.crossContaminationNotes || null,
      imageUrl: input.imageUrl || null,
      shopifyVariantId: input.shopifyVariantId || null,
      isAvailable: input.isAvailable,
    },
  });

  return NextResponse.json({ item }, { status: 201 });
}
