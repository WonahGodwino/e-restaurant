import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** GET /api/menu – returns all available menu items */
export async function GET() {
  try {
    const items = await prisma.menuItem.findMany({
      where: { available: true },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });
    return NextResponse.json(items);
  } catch {
    return NextResponse.json(
      { error: "Failed to load menu." },
      { status: 500 }
    );
  }
}
