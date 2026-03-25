import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

function isAdminAuthorized(request: NextRequest): boolean {
  const key = request.headers.get("x-admin-key");
  const expected = process.env.ADMIN_DASHBOARD_KEY;
  return Boolean(expected) && key === expected;
}

export async function GET(request: NextRequest) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orders = await db.order.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      items: {
        orderBy: { createdAt: "asc" },
        include: {
          modifiers: true,
        },
      },
    },
  });

  return NextResponse.json({ orders });
}
