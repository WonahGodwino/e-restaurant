import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const items = await db.foodItem.findMany({
    where: { isAvailable: true },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  return NextResponse.json({ items });
}
