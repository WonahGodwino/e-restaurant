import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * GET /api/slots?date=YYYY-MM-DD&type=delivery|pickup
 *
 * Returns available time slots for a given date and service type.
 * Filters out slots that have already passed the cutoff window.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const dateParam = searchParams.get("date");
  const type = searchParams.get("type") ?? "delivery";

  if (!dateParam || !/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
    return NextResponse.json({ error: "Invalid or missing date parameter (YYYY-MM-DD)." }, { status: 400 });
  }

  if (type !== "delivery" && type !== "pickup") {
    return NextResponse.json({ error: "type must be 'delivery' or 'pickup'." }, { status: 400 });
  }

  const date = new Date(`${dateParam}T00:00:00`);
  if (isNaN(date.getTime())) {
    return NextResponse.json({ error: "Invalid date." }, { status: 400 });
  }

  const dayOfWeek = date.getDay(); // 0=Sunday ... 6=Saturday

  const windows = await db.serviceWindow.findMany({
    where: {
      dayOfWeek,
      isActive: true,
      ...(type === "delivery" ? { isDelivery: true } : { isPickup: true }),
    },
  });

  if (windows.length === 0) {
    return NextResponse.json({ slots: [] });
  }

  const now = new Date();
  const slots: string[] = [];

  for (const win of windows) {
    const [openHour, openMin] = win.openTime.split(":").map(Number);
    const [closeHour, closeMin] = win.closeTime.split(":").map(Number);

    let cursor = openHour * 60 + openMin;
    const closeMinutes = closeHour * 60 + closeMin;

    while (cursor + win.slotDurationMinutes <= closeMinutes) {
      const slotHour = Math.floor(cursor / 60);
      const slotMin = cursor % 60;

      // Build the full datetime of this slot
      const slotDate = new Date(date);
      slotDate.setHours(slotHour, slotMin, 0, 0);

      // Enforce cutoff: slot must be at least cutoffMinutes in the future
      const cutoffMs = win.cutoffMinutes * 60 * 1000;
      if (slotDate.getTime() - now.getTime() >= cutoffMs) {
        const label = `${String(slotHour).padStart(2, "0")}:${String(slotMin).padStart(2, "0")}`;
        if (!slots.includes(label)) {
          slots.push(label);
        }
      }

      cursor += win.slotDurationMinutes;
    }
  }

  slots.sort();

  return NextResponse.json({ slots });
}
