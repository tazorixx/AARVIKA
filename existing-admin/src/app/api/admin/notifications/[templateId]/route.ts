import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireAdmin, errorResponse } from "@/lib/catalog/http";
import { NOTIFICATION_ADMIN_ROLES, updateNotificationTemplate } from "@/lib/admin/notifications";
import { isNotificationTemplateKey } from "@/lib/notifications/templates";

export const runtime = "nodejs";

export async function PATCH(request: Request, { params }: { params: Promise<{ templateId: string }> }) {
  try {
    await requireAdmin(request, [...NOTIFICATION_ADMIN_ROLES]);
    const { templateId } = await params;
    if (!isNotificationTemplateKey(templateId)) {
      return NextResponse.json({ error: "Unknown notification template." }, { status: 404 });
    }
    const body = await request.json();
    const template = await updateNotificationTemplate(getAdminDb(), templateId, body);
    return NextResponse.json({ template });
  } catch (error) {
    return errorResponse(error);
  }
}
