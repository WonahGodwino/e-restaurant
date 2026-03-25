import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAuthorised } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

/** PUT /api/admin/menu/[id] – update a menu item */
export async function PUT(req: NextRequest, { params }: Params) {
  if (!isAuthorised(req)) {
    return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
  }
  const { id } = await params;
  const itemId = parseInt(id, 10);
  if (isNaN(itemId)) {
    return NextResponse.json({ error: "Invalid id." }, { status: 400 });
  }
  try {
    const body = await req.json();
    const item = await prisma.menuItem.update({
      where: { id: itemId },
      data: {
        name: body.name,
        description: body.description,
        category: body.category,
        priceGbp: body.priceGbp !== undefined ? Number(body.priceGbp) : undefined,
        imageUrl: body.imageUrl,
        shopifyVariantId: body.shopifyVariantId,
        available: body.available,
      },
    });
    return NextResponse.json(item);
  } catch {
    return NextResponse.json({ error: "Failed to update item." }, { status: 500 });
  }
}

/** DELETE /api/admin/menu/[id] – delete a menu item */
export async function DELETE(req: NextRequest, { params }: Params) {
  if (!isAuthorised(req)) {
    return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
  }
  const { id } = await params;
  const itemId = parseInt(id, 10);
  if (isNaN(itemId)) {
    return NextResponse.json({ error: "Invalid id." }, { status: 400 });
  }
  try {
    await prisma.menuItem.delete({ where: { id: itemId } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete item." }, { status: 500 });
  }
}
