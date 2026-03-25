import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAuthorised } from "@/lib/auth";

/** GET /api/admin/menu – list all menu items (admin) */
export async function GET(req: NextRequest) {
  if (!isAuthorised(req)) {
    return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
  }
  const items = await prisma.menuItem.findMany({
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });
  return NextResponse.json(items);
}

/** POST /api/admin/menu – create a new menu item */
export async function POST(req: NextRequest) {
  if (!isAuthorised(req)) {
    return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
  }
  try {
    const body = await req.json();
    const { name, description, category, priceGbp, imageUrl, shopifyVariantId, available } = body as {
      name: string;
      description: string;
      category: string;
      priceGbp: number;
      imageUrl?: string;
      shopifyVariantId?: string;
      available?: boolean;
    };

    if (!name || !description || !category || priceGbp == null) {
      return NextResponse.json(
        { error: "name, description, category and priceGbp are required." },
        { status: 400 }
      );
    }

    const item = await prisma.menuItem.create({
      data: {
        name,
        description,
        category,
        priceGbp: Number(priceGbp),
        imageUrl: imageUrl ?? "",
        shopifyVariantId: shopifyVariantId ?? "",
        available: available !== false,
      },
    });
    return NextResponse.json(item, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create item." }, { status: 500 });
  }
}
