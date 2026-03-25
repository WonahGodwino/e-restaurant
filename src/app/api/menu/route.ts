import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const items = await db.foodItem.findMany({
    where: { isAvailable: true, stockQuantity: { gt: 0 } },
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
