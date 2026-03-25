import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAuthorised } from "@/lib/auth";
import { z } from "zod";

const serviceWindowSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  openTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "openTime must be in HH:MM format"),
  closeTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "closeTime must be in HH:MM format"),
  slotDurationMinutes: z.number().int().min(5).max(240).optional().default(30),
  cutoffMinutes: z.number().int().min(0).max(1440).optional().default(60),
  isPickup: z.boolean().optional().default(true),
  isDelivery: z.boolean().optional().default(true),
  isActive: z.boolean().optional().default(true),
});

export async function GET(request: NextRequest) {
  if (!isAuthorised(request)) {
    return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
  }

  const windows = await db.serviceWindow.findMany({
    orderBy: [{ dayOfWeek: "asc" }, { openTime: "asc" }],
  });

  return NextResponse.json({ windows });
}

export async function POST(request: NextRequest) {
  if (!isAuthorised(request)) {
    return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
  }

  const body = await request.json();
  const parsed = serviceWindowSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const data = parsed.data;

  // Validate time ordering
  const [openHour, openMin] = data.openTime.split(":").map(Number);
  const [closeHour, closeMin] = data.closeTime.split(":").map(Number);
  if (openHour * 60 + openMin >= closeHour * 60 + closeMin) {
    return NextResponse.json(
      { error: "openTime must be before closeTime." },
      { status: 400 },
    );
  }

  const window = await db.serviceWindow.create({
    data: {
      dayOfWeek: data.dayOfWeek,
      openTime: data.openTime,
      closeTime: data.closeTime,
      slotDurationMinutes: data.slotDurationMinutes,
      cutoffMinutes: data.cutoffMinutes,
      isPickup: data.isPickup,
      isDelivery: data.isDelivery,
      isActive: data.isActive,
    },
  });

  return NextResponse.json({ window }, { status: 201 });
}
