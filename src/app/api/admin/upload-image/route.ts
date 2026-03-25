import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const ALLOWED_CONTENT_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

function isAdminAuthorized(request: NextRequest): boolean {
  const key = request.headers.get("x-admin-key");
  const expected = process.env.ADMIN_DASHBOARD_KEY ?? process.env.ADMIN_API_KEY;
  return Boolean(expected) && key === expected;
}

function detectImageType(buffer: Buffer): "image/jpeg" | "image/png" | "image/webp" | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }

  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "image/png";
  }

  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return "image/webp";
  }

  return null;
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
  const detectedType = detectImageType(buffer);

  if (!detectedType || detectedType !== uploaded.type) {
    return NextResponse.json(
      { error: "Uploaded file content does not match the declared image type." },
      { status: 400 },
    );
  }

  const fileName = `${Date.now()}-${randomUUID()}${extensionFromFile(uploaded)}`;
  const uploadDirectory = path.join(process.cwd(), "public", "uploads");
  const absoluteFilePath = path.join(uploadDirectory, fileName);

  await mkdir(uploadDirectory, { recursive: true });
  await writeFile(absoluteFilePath, buffer);

  return NextResponse.json({ imageUrl: `/uploads/${fileName}` }, { status: 201 });
}
