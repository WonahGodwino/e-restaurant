import type { NextRequest } from "next/server";

const ADMIN_API_KEY = process.env.ADMIN_API_KEY ?? "";

/**
 * Returns true if the incoming request carries a valid admin API key.
 * Matches the value of the ADMIN_API_KEY environment variable.
 */
export function isAuthorised(req: NextRequest): boolean {
  const key = req.headers.get("x-admin-key") ?? "";
  return ADMIN_API_KEY.length > 0 && key === ADMIN_API_KEY;
}
