import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAuthorised } from "@/lib/auth";
import { z } from "zod";

const VALID_STATUSES = [
  "PENDING_PAYMENT",
  "PAID",
  "FAILED",
  "CANCELLED",
  "RECEIVED",
  "PREPARING",
  "READY",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
] as const;

const updateStatusSchema = z.object({
  status: z.enum(VALID_STATUSES),
  note: z.string().max(500).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isAuthorised(request)) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const { id } = await params;

  const body = await request.json().catch(() => null);
  const parsed = updateStatusSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { status, note } = parsed.data;

  const existing = await db.order.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const [order] = await db.$transaction([
    db.order.update({
      where: { id },
      data: { status: status as never },
      include: {
        items: { orderBy: { createdAt: "asc" } },
        statusHistory: { orderBy: { createdAt: "asc" } },
      },
    }),
    db.orderStatusHistory.create({
      data: {
        orderId: id,
        status: status as never,
        note: note ?? null,
      },
    }),
  ]);

  return NextResponse.json({ order });
}
