import { NextResponse, type NextRequest } from "next/server";
import { checkRateLimit, getClientKey, rateLimitResponse } from "@/lib/rate-limit";

// Route-specific limits. Coupon validation gets the tightest limit since
// it's the most brute-forceable endpoint (trying many codes quickly).
const RATE_LIMITS: { pattern: RegExp; limit: number; windowMs: number }[] = [
  { pattern: /^\/api\/checkout\/coupon$/, limit: 8, windowMs: 60_000 },
  { pattern: /^\/api\/cart$/, limit: 30, windowMs: 60_000 },
  { pattern: /^\/api\/support\/tickets/, limit: 15, windowMs: 60_000 },
];

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  if (process.env.NEXT_PUBLIC_AARVIKA_ISOLATED === "true" && (
    (pathname.startsWith("/api/admin/uploads/") && pathname !== "/api/admin/uploads/demo-product") ||
    pathname.startsWith("/api/checkout/razorpay/") ||
    (request.method !== "GET" && (pathname === "/api/checkout/order" || /^\/api\/admin\/orders\/[^/]+\/refund$/.test(pathname)))
  )) {
    return NextResponse.json({ error: "External uploads, payment processing and real order placement are disabled in this isolated admin." }, { status: 503 });
  }
  const rule = RATE_LIMITS.find((r) => r.pattern.test(pathname));

  if (!rule) {
    return NextResponse.next();
  }

  const clientKey = `${pathname}:${getClientKey(request)}`;
  const result = checkRateLimit(clientKey, rule.limit, rule.windowMs);

  if (!result.allowed) {
    return rateLimitResponse(result.resetAt);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/checkout/:path*", "/api/cart", "/api/support/tickets/:path*", "/api/admin/uploads/:path*", "/api/admin/orders/:path*"],
};
