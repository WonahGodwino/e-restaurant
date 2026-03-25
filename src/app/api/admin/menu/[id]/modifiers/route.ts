import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

function isAdminAuthorized(request: NextRequest): boolean {
  const key = request.headers.get("x-admin-key");
  const expected = process.env.ADMIN_DASHBOARD_KEY;
  return Boolean(expected) && key === expected;
}

type RouteContext = {
  params: Promise<{ id: string }>;
};

const modifierSchema = z.object({
  name: z.string().trim().min(1).max(100),
  priceDeltaPence: z.number().int().min(-10000).max(50000).default(0),
  isDefault: z.boolean().default(false),
  displayOrder: z.number().int().min(0).default(0),
});

const createModifierGroupSchema = z.object({
  name: z.string().trim().min(1).max(100),
  isRequired: z.boolean().default(false),
  allowMultiple: z.boolean().default(false),
  displayOrder: z.number().int().min(0).default(0),
  modifiers: z.array(modifierSchema).min(1).max(30),
});

export async function POST(request: NextRequest, context: RouteContext) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: foodItemId } = await context.params;

  const foodItem = await db.foodItem.findUnique({ where: { id: foodItemId } });
  if (!foodItem) {
    return NextResponse.json({ error: "Food item not found." }, { status: 404 });
  }

  const body = await request.json();
  const parsed = createModifierGroupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const input = parsed.data;

  const group = await db.modifierGroup.create({
    data: {
      foodItemId,
      name: input.name,
      isRequired: input.isRequired,
      allowMultiple: input.allowMultiple,
      displayOrder: input.displayOrder,
      modifiers: {
        create: input.modifiers.map((mod) => ({
          name: mod.name,
          priceDeltaPence: mod.priceDeltaPence,
          isDefault: mod.isDefault,
          displayOrder: mod.displayOrder,
        })),
      },
    },
    include: {
      modifiers: {
        orderBy: { displayOrder: "asc" },
      },
    },
  });

  return NextResponse.json({ group }, { status: 201 });
}
