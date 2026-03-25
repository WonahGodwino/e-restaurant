import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const ALLOWED_CONTENT_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

function isAdminAuthorized(request: NextRequest): boolean {
  const key = request.headers.get("x-admin-key");
  const expected = process.env.ADMIN_DASHBOARD_KEY;
  return Boolean(expected) && key === expected;
}

function extensionFromFile(file: File): string {
  const originalExt = path.extname(file.name).toLowerCase();
  if (originalExt === ".jpg" || originalExt === ".jpeg") return ".jpg";
  if (originalExt === ".png") return ".png";
  if (originalExt === ".webp") return ".webp";
  if (file.type === "image/png") return ".png";
  if (file.type === "image/webp") return ".webp";
  return ".jpg";
}

export async function POST(request: NextRequest) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const uploaded = formData.get("image");

  if (!(uploaded instanceof File)) {
    return NextResponse.json({ error: "No image file was provided." }, { status: 400 });
  }

  if (!ALLOWED_CONTENT_TYPES.has(uploaded.type)) {
    return NextResponse.json(
      { error: "Only JPG, PNG, and WEBP images are supported." },
      { status: 400 },
    );
  }

  if (uploaded.size > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json({ error: "Image size must be 5MB or less." }, { status: 400 });
  }

  const bytes = await uploaded.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const fileName = `${Date.now()}-${randomUUID()}${extensionFromFile(uploaded)}`;
  const uploadDirectory = path.join(process.cwd(), "public", "uploads");
  const absoluteFilePath = path.join(uploadDirectory, fileName);

  await mkdir(uploadDirectory, { recursive: true });
  await writeFile(absoluteFilePath, buffer);

  return NextResponse.json({ imageUrl: `/uploads/${fileName}` }, { status: 201 });
}
