// Simple in-memory sliding-window rate limiter.
//
// NOTE: this is a real, working, no-new-dependency limiter that stops
// naive/scripted abuse (e.g. brute-forcing coupon codes, hammering the
// cart endpoint). It is per-server-instance memory, so on a multi-instance
// serverless host each instance has its own counter — it is NOT a
// distributed limiter. For stronger guarantees at real scale, replace
// this with a shared store (e.g. Upstash Redis rate limiting), but this
// is a genuine improvement over having zero protection today.

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

// Periodically clear stale buckets so this map doesn't grow forever.
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt < now) buckets.delete(key);
  }
}, 60_000).unref?.();

export function getClientKey(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const ip = forwardedFor?.split(",")[0]?.trim() || "unknown";
  return ip;
}

/**
 * Returns true if the request is allowed, false if it should be rejected.
 *
 * @param key   Unique identifier for the caller (usually IP, optionally
 *              combined with route name for per-route limits).
 * @param limit Max requests allowed within the window.
 * @param windowMs Window size in milliseconds.
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt < now) {
    const resetAt = now + windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: limit - 1, resetAt };
  }

  if (existing.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  return {
    allowed: true,
    remaining: limit - existing.count,
    resetAt: existing.resetAt,
  };
}

export function rateLimitResponse(resetAt: number) {
  const retryAfterSeconds = Math.max(
    1,
    Math.ceil((resetAt - Date.now()) / 1000),
  );

  return new Response(
    JSON.stringify({
      error: "Too many requests. Please try again in a moment.",
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(retryAfterSeconds),
      },
    },
  );
}
