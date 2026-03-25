import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

function isAdminAuthorized(request: NextRequest): boolean {
  const key = request.headers.get("x-admin-key");
  const expected = process.env.ADMIN_DASHBOARD_KEY;
  return Boolean(expected) && key === expected;
}

type RouteContext = {
  params: Promise<{ modifierGroupId: string }>;
};

export async function DELETE(request: NextRequest, context: RouteContext) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { modifierGroupId } = await context.params;

  const group = await db.modifierGroup.findUnique({ where: { id: modifierGroupId } });
  if (!group) {
    return NextResponse.json({ error: "Modifier group not found." }, { status: 404 });
  }

  await db.modifierGroup.delete({ where: { id: modifierGroupId } });

  return NextResponse.json({ success: true });
}
