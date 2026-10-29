import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { cronAuthorizationError } from "@/lib/cron/auth";
import { processQueuedNotifications } from "@/lib/notifications/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const authError = cronAuthorizationError(request);
    if (authError) return authError;

    const result = await processQueuedNotifications(getAdminDb());
    return NextResponse.json({ ok: true, ...result, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error("GET /api/cron/process-notifications failed:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Notification processing failed." }, { status: 500 });
  }
}
