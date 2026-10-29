import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireAdmin, errorResponse } from "@/lib/catalog/http";
import { listNotificationTemplates, NOTIFICATION_ADMIN_ROLES } from "@/lib/admin/notifications";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    await requireAdmin(request, [...NOTIFICATION_ADMIN_ROLES]);
    const templates = await listNotificationTemplates(getAdminDb());
    return NextResponse.json({ templates });
  } catch (error) {
    return errorResponse(error);
  }
}
