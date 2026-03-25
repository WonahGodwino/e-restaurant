import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAuthorised } from "@/lib/auth";

export async function GET(request: NextRequest) {
  if (!isAuthorised(request)) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  try {
    const reservations = await db.reservation.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ reservations });
  } catch (error) {
    console.error("Failed to fetch reservations:", error);
    return NextResponse.json(
      { error: "Failed to fetch reservations." },
      { status: 500 },
    );
  }
}
