import { NextResponse } from "next/server";
import { adminAuth, ADMIN_ROLES, verifyBearerToken, isAdminRole, getAdminDb } from "@/lib/firebase-admin";
import { recordAdminAudit } from "@/lib/admin/audit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const caller = await verifyBearerToken(request);

    if (caller.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await request.json()) as { uid?: unknown; role?: unknown };
    const uid = typeof body.uid === "string" ? body.uid.trim() : "";
    const role = typeof body.role === "string" ? body.role.trim() : "";

    if (!uid || !isAdminRole(role)) {
      return NextResponse.json(
        { error: `uid and role are required. role must be one of: ${ADMIN_ROLES.join(", ")}.` },
        { status: 400 }
      );
    }

    const target = await adminAuth.getUser(uid);
    await adminAuth.setCustomUserClaims(target.uid, { role });
    await recordAdminAudit(getAdminDb(), { actorUid: caller.uid, actorRole: "SUPER_ADMIN", action: "ADMIN_ROLE_CHANGED", entityType: "admin_access", entityId: target.uid, summary: `Changed admin role to ${role}`, metadata: { role } });

    return NextResponse.json({ uid: target.uid, role });
  } catch (error) {
    console.error("set-role failed", error);
    return NextResponse.json({ error: "Unable to change role." }, { status: 500 });
  }
}
