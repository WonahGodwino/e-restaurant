import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAuthorised } from "@/lib/auth";
import { z } from "zod";

const updateServiceWindowSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6).optional(),
  openTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "openTime must be in HH:MM format")
    .optional(),
  closeTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "closeTime must be in HH:MM format")
    .optional(),
  slotDurationMinutes: z.number().int().min(5).max(240).optional(),
  cutoffMinutes: z.number().int().min(0).max(1440).optional(),
  isPickup: z.boolean().optional(),
  isDelivery: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  if (!isAuthorised(request)) {
    return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
  }

  const { id } = await context.params;

  const existing = await db.serviceWindow.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Service window not found." }, { status: 404 });
  }

  const body = await request.json();
  const parsed = updateServiceWindowSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const data = parsed.data;

  // Validate time ordering if both are present (or mixed with existing)
  const openTime = data.openTime ?? existing.openTime;
  const closeTime = data.closeTime ?? existing.closeTime;
  const [openHour, openMin] = openTime.split(":").map(Number);
  const [closeHour, closeMin] = closeTime.split(":").map(Number);
  if (openHour * 60 + openMin >= closeHour * 60 + closeMin) {
    return NextResponse.json(
      { error: "openTime must be before closeTime." },
      { status: 400 },
    );
  }

  const updated = await db.serviceWindow.update({
    where: { id },
    data,
  });

  return NextResponse.json({ window: updated });
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  if (!isAuthorised(request)) {
    return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
  }

  const { id } = await context.params;

  const existing = await db.serviceWindow.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Service window not found." }, { status: 404 });
  }

  await db.serviceWindow.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
