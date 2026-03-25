import type { NextRequest } from "next/server";

/**
 * Returns true if the incoming request carries a valid admin API key.
 * Matches ADMIN_DASHBOARD_KEY, or falls back to ADMIN_API_KEY.
 */
export function isAuthorised(req: NextRequest): boolean {
  const expected = process.env.ADMIN_DASHBOARD_KEY ?? process.env.ADMIN_API_KEY ?? "";
  const key = req.headers.get("x-admin-key") ?? "";
  return expected.length > 0 && key === expected;
}
