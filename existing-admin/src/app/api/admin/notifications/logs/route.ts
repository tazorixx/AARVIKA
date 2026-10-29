import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireAdmin, errorResponse } from "@/lib/catalog/http";
import { listRecentNotificationLogs, NOTIFICATION_ADMIN_ROLES } from "@/lib/admin/notifications";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    await requireAdmin(request, [...NOTIFICATION_ADMIN_ROLES]);
    const logs = await listRecentNotificationLogs(getAdminDb());
    return NextResponse.json({ logs });
  } catch (error) {
    return errorResponse(error);
  }
}
