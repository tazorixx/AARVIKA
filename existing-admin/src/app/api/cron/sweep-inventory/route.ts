import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { cronAuthorizationError } from "@/lib/cron/auth";
import { sweepExpiredOrders } from "@/lib/checkout/inventory";
import { sweepStaleCheckoutAttempts } from "@/lib/checkout/idempotency";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const authError = cronAuthorizationError(request);
    if (authError) return authError;

    const db = getAdminDb();
    const sweptCount = await sweepExpiredOrders(db);
    const staleCheckoutAttempts = await sweepStaleCheckoutAttempts(db);

    return NextResponse.json({
      ok: true,
      sweptCount,
      staleCheckoutAttempts,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("GET /api/cron/sweep-inventory failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Sweep failed" },
      { status: 500 },
    );
  }
}
