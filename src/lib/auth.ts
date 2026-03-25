import type { NextRequest } from "next/server";
import { timingSafeEqual } from "node:crypto";

/**
 * Returns true if the incoming request carries a valid admin API key.
 * Matches ADMIN_DASHBOARD_KEY, or falls back to ADMIN_API_KEY.
 */
export function isAuthorised(req: NextRequest): boolean {
  const expected = (process.env.ADMIN_DASHBOARD_KEY ?? process.env.ADMIN_API_KEY ?? "").trim();
  const key = (req.headers.get("x-admin-key") ?? "").trim();

  if (!expected || !key) {
    return false;
  }

  const expectedBuffer = Buffer.from(expected);
  const keyBuffer = Buffer.from(key);
  if (expectedBuffer.length !== keyBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, keyBuffer);
}
