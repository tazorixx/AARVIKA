import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/catalog/http";
import { serializeAuditValue } from "@/lib/admin/audit";

export const runtime = "nodejs";

const AUDIT_ROLES = ["SUPER_ADMIN", "ADMIN"] as const;

export async function GET(request: Request) {
  try {
    await requireAdmin(request, [...AUDIT_ROLES]);
    const url = new URL(request.url);
    const q = url.searchParams.get("q")?.trim().toLowerCase() || "";
    const action = url.searchParams.get("action")?.trim() || "";
    const limitValue = Number(url.searchParams.get("limit") || 100);
    const limit = Number.isInteger(limitValue) ? Math.min(Math.max(limitValue, 1), 200) : 100;

    const snap = await getAdminDb()
      .collection("admin_audit_logs")
      .orderBy("createdAt", "desc")
      .limit(limit)
      .get();

    let logs = snap.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        actorUid: String(data.actorUid || ""),
        actorRole: String(data.actorRole || ""),
        action: String(data.action || ""),
        entityType: String(data.entityType || ""),
        entityId: String(data.entityId || ""),
        summary: String(data.summary || ""),
        metadata: data.metadata && typeof data.metadata === "object" ? data.metadata : {},
        createdAt: serializeAuditValue(data.createdAt),
      };
    });

    if (action) logs = logs.filter((item) => item.action === action);
    if (q) {
      logs = logs.filter((item) =>
        [item.actorUid, item.actorRole, item.action, item.entityType, item.entityId, item.summary]
          .join(" ")
          .toLowerCase()
          .includes(q),
      );
    }

    return NextResponse.json({ logs });
  } catch (error) {
    console.error("GET /api/admin/audit-logs failed", error);
    return NextResponse.json({ error: "Unable to load admin audit logs." }, { status: 500 });
  }
}
