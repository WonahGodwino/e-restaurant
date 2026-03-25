import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAuthorised } from "@/lib/auth";

export async function GET(request: NextRequest) {
  if (!isAuthorised(request)) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  try {
    const cateringRequests = await db.cateringRequest.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ cateringRequests });
  } catch (error) {
    console.error("Failed to fetch catering requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch catering requests." },
      { status: 500 },
    );
  }
}
