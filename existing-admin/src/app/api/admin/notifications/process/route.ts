import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireAdmin, errorResponse } from "@/lib/catalog/http";
import { NOTIFICATION_ADMIN_ROLES } from "@/lib/admin/notifications";
import { processQueuedNotifications } from "@/lib/notifications/service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    await requireAdmin(request, [...NOTIFICATION_ADMIN_ROLES]);
    const result = await processQueuedNotifications(getAdminDb());
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return errorResponse(error);
  }
}
