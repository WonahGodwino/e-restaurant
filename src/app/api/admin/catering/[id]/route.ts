import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAuthorised } from "@/lib/auth";
import { updateCateringStatusSchema } from "@/lib/validators";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isAuthorised(request)) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const parsed = updateCateringStatusSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const cateringRequest = await db.cateringRequest.update({
      where: { id },
      data: { status: parsed.data.status },
    });

    return NextResponse.json({ cateringRequest });
  } catch (error) {
    console.error("Failed to update catering request:", error);
    return NextResponse.json(
      { error: "Failed to update catering request." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isAuthorised(request)) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const { id } = await params;

  try {
    await db.cateringRequest.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete catering request:", error);
    return NextResponse.json(
      { error: "Failed to delete catering request." },
      { status: 500 },
    );
  }
}
