import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const WINDOW_MS = Number(process.env.ORDER_STATUS_RATE_LIMIT_WINDOW_MS ?? 60_000);
const MAX_REQUESTS_PER_WINDOW = Number(process.env.ORDER_STATUS_RATE_LIMIT_MAX ?? 20);
const MAX_REQUESTS_FOR_UNKNOWN_CLIENT = Number(process.env.ORDER_STATUS_RATE_LIMIT_UNKNOWN_MAX ?? 8);
const MAX_TRACKED_CLIENTS = Number(process.env.ORDER_STATUS_RATE_LIMIT_MAX_CLIENTS ?? 20_000);
const CLEANUP_INTERVAL_MS = Number(process.env.ORDER_STATUS_RATE_LIMIT_CLEANUP_INTERVAL_MS ?? 30_000);

type RateLimitEntry = {
  count: number;
  resetAt: number;
  lastSeenAt: number;
};

const requestWindowByClient = new Map<string, RateLimitEntry>();
let lastCleanupAt = 0;

type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfterSeconds: number;
};

function getClientIp(request: NextRequest): string | null {
  const forwardedFor = request.headers
    .get("x-forwarded-for")
    ?.split(",")[0]
    ?.trim();
  const realIp = request.headers.get("x-real-ip")?.trim();
  const cfConnectingIp = request.headers.get("cf-connecting-ip")?.trim();
  const candidate = forwardedFor || realIp || cfConnectingIp;
  return candidate && candidate.length > 0 ? candidate : null;
}

function getClientKey(request: NextRequest): string {
  const ip = getClientIp(request);
  if (ip) {
    return ip;
  }

  // Fallback key for environments where the client IP is not exposed.
  const userAgent = request.headers.get("user-agent")?.slice(0, 120) || "unknown-agent";
  return `unknown:${userAgent}`;
}

function maybeCleanupExpiredWindows(now: number) {
  if (
    now - lastCleanupAt < CLEANUP_INTERVAL_MS &&
    requestWindowByClient.size <= MAX_TRACKED_CLIENTS
  ) {
    return;
  }

  for (const [key, entry] of requestWindowByClient.entries()) {
    const expired = now > entry.resetAt;
    const stale = now - entry.lastSeenAt > WINDOW_MS * 2;
    if (expired || stale) {
      requestWindowByClient.delete(key);
    }
  }

  lastCleanupAt = now;
}

function buildRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const resetEpochSeconds = Math.ceil(result.resetAt / 1000);
  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(Math.max(0, result.remaining)),
    "X-RateLimit-Reset": String(resetEpochSeconds),
    "Retry-After": String(result.retryAfterSeconds),
  };
}

function applyRateLimit(request: NextRequest): RateLimitResult {
  const now = Date.now();
  maybeCleanupExpiredWindows(now);

  const clientKey = getClientKey(request);
  const usingUnknownClientBucket = clientKey.startsWith("unknown:");
  const limit = usingUnknownClientBucket
    ? Math.min(MAX_REQUESTS_PER_WINDOW, MAX_REQUESTS_FOR_UNKNOWN_CLIENT)
    : MAX_REQUESTS_PER_WINDOW;

  const current = requestWindowByClient.get(clientKey);

  if (!current || now > current.resetAt) {
    const resetAt = now + WINDOW_MS;
    requestWindowByClient.set(clientKey, {
      count: 1,
      resetAt,
      lastSeenAt: now,
    });
    return {
      allowed: true,
      limit,
      remaining: Math.max(0, limit - 1),
      resetAt,
      retryAfterSeconds: Math.max(1, Math.ceil(WINDOW_MS / 1000)),
    };
  }

  if (current.count >= limit) {
    const retryAfterSeconds = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
    return {
      allowed: false,
      limit,
      remaining: 0,
      resetAt: current.resetAt,
      retryAfterSeconds,
    };
  }

  current.count += 1;
  current.lastSeenAt = now;
  requestWindowByClient.set(clientKey, current);

  const retryAfterSeconds = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
  return {
    allowed: true,
    limit,
    remaining: Math.max(0, limit - current.count),
    resetAt: current.resetAt,
    retryAfterSeconds,
  };
}

export async function GET(request: NextRequest) {
  const rateLimit = applyRateLimit(request);
  const rateLimitHeaders = buildRateLimitHeaders(rateLimit);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please retry shortly." },
      {
        status: 429,
        headers: rateLimitHeaders,
      },
    );
  }

  const orderId = request.nextUrl.searchParams.get("orderId")?.trim();
  const email = request.nextUrl.searchParams.get("email")?.trim().toLowerCase();

  if (!orderId || !email) {
    return NextResponse.json(
      { error: "Both orderId and email are required." },
      { status: 400, headers: rateLimitHeaders },
    );
  }

  const order = await db.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        orderBy: { createdAt: "asc" },
      },
      statusHistory: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!order || order.customerEmail.trim().toLowerCase() !== email) {
    return NextResponse.json(
      { error: "Order not found for the provided details." },
      { status: 404, headers: rateLimitHeaders },
    );
  }

  return NextResponse.json(
    {
      order: {
        id: order.id,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        customerPhone: order.customerPhone,
        fulfillmentType: order.fulfillmentType,
        deliveryPostcode: order.deliveryPostcode,
        deliveryZoneName: order.deliveryZoneName,
        deliveryAddress: order.deliveryAddress,
        deliveryFeePence: order.deliveryFeePence,
        notes: order.notes,
        totalPence: order.totalPence,
        currency: order.currency,
        status: order.status,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        items: order.items,
        statusHistory: order.statusHistory,
      },
    },
    { headers: rateLimitHeaders },
  );
}