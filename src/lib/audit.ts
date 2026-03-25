import { db } from "@/lib/db";

/**
 * Records a sensitive admin or staff action in the audit log.
 *
 * @param actor  - Identifier for who performed the action (e.g. "admin", a user ID, or a key prefix)
 * @param action - Machine-readable action string (e.g. "menu.create", "user.update")
 * @param target - The entity affected (e.g. "FoodItem:abc123", "User:xyz789", "Order:order1")
 * @param details - Optional JSON-serialisable object with extra context
 */
export async function logAuditEvent(
  actor: string,
  action: string,
  target: string,
  details?: Record<string, unknown>,
): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        actor,
        action,
        target,
        details: details ? JSON.stringify(details) : null,
      },
    });
  } catch (err) {
    // Audit logging must never block the primary operation
    console.error("[audit] Failed to write audit log:", err);
  }
}

/**
 * Derives a short, non-sensitive actor identifier from the admin key header value.
 * Returns "admin" if the key is empty or undefined.
 */
export function getActorFromKey(key: string | null | undefined): string {
  if (!key || key.length === 0) return "admin";
  // Use only the last 4 characters so the full key is never stored
  return `admin:…${key.slice(-4)}`;
}
