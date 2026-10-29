import { NextResponse } from "next/server";
import { adminAuth, ADMIN_ROLES, isAdminRole, verifyBearerToken, getAdminDb } from "@/lib/firebase-admin";
import { recordAdminAudit } from "@/lib/admin/audit";

export const runtime = "nodejs";

function requireSuperAdmin(role: string | null) {
  return role === "SUPER_ADMIN";
}

export async function GET(request: Request) {
  try {
    const caller = await verifyBearerToken(request);
    if (!requireSuperAdmin(caller.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const users: Array<Record<string, unknown>> = [];
    let pageToken: string | undefined;
    do {
      const result = await adminAuth.listUsers(1000, pageToken);
      for (const user of result.users) {
        const role = typeof user.customClaims?.role === "string" && isAdminRole(user.customClaims.role)
          ? user.customClaims.role
          : null;
        if (!role) continue;
        users.push({
          uid: user.uid,
          name: user.displayName || user.email?.split("@")[0] || "Admin",
          email: user.email || "",
          role,
          disabled: user.disabled,
          emailVerified: user.emailVerified,
          createdAt: user.metadata.creationTime || null,
          lastSignInAt: user.metadata.lastSignInTime || null,
        });
      }
      pageToken = result.pageToken;
    } while (pageToken);

    users.sort((a, b) => String(a.name).localeCompare(String(b.name)));
    return NextResponse.json({ users, roles: ADMIN_ROLES });
  } catch (error) {
    console.error("GET /api/admin/admin-users failed", error);
    return NextResponse.json({ error: "Unable to load admin accounts." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const caller = await verifyBearerToken(request);
    if (!requireSuperAdmin(caller.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = (await request.json()) as { name?: unknown; email?: unknown; password?: unknown; role?: unknown };
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const role = typeof body.role === "string" ? body.role.trim() : "";

    if (!name || !email || !password || !isAdminRole(role)) {
      return NextResponse.json({ error: "Name, email, password and a valid role are required." }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    }

    const user = await adminAuth.createUser({ displayName: name, email, password, emailVerified: false });
    await adminAuth.setCustomUserClaims(user.uid, { role });
    await recordAdminAudit(getAdminDb(), { actorUid: caller.uid, actorRole: caller.role!, action: "ADMIN_CREATED", entityType: "admin_user", entityId: user.uid, summary: `Created ${role} admin account`, metadata: { email, role } });

    return NextResponse.json({
      user: { uid: user.uid, name, email, role, disabled: false, emailVerified: false },
    }, { status: 201 });
  } catch (error: unknown) {
    console.error("POST /api/admin/admin-users failed", error);
    const code = typeof error === "object" && error && "code" in error ? String((error as { code?: unknown }).code) : "";
    if (code === "auth/email-already-exists") return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    if (code === "auth/invalid-email") return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    return NextResponse.json({ error: "Unable to create admin account." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const caller = await verifyBearerToken(request);
    if (!requireSuperAdmin(caller.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = (await request.json()) as { uid?: unknown; role?: unknown; disabled?: unknown; name?: unknown };
    const uid = typeof body.uid === "string" ? body.uid.trim() : "";
    if (!uid) return NextResponse.json({ error: "uid is required." }, { status: 400 });
    if (uid === caller.uid && body.disabled === true) return NextResponse.json({ error: "You cannot disable your own account." }, { status: 400 });
    if (uid === caller.uid && body.role !== undefined && body.role !== "SUPER_ADMIN") return NextResponse.json({ error: "You cannot remove your own SUPER_ADMIN role." }, { status: 400 });

    const updates: { disabled?: boolean; displayName?: string } = {};
    if (typeof body.disabled === "boolean") updates.disabled = body.disabled;
    if (typeof body.name === "string" && body.name.trim()) updates.displayName = body.name.trim();
    if (!Object.keys(updates).length && body.role === undefined) return NextResponse.json({ error: "No changes supplied." }, { status: 400 });

    const user = await adminAuth.getUser(uid);
    if (Object.keys(updates).length) await adminAuth.updateUser(uid, updates);
    let role = typeof user.customClaims?.role === "string" && isAdminRole(user.customClaims.role) ? user.customClaims.role : null;
    if (body.role !== undefined) {
      if (typeof body.role !== "string" || !isAdminRole(body.role)) return NextResponse.json({ error: "Invalid admin role." }, { status: 400 });
      role = body.role;
      await adminAuth.setCustomUserClaims(uid, { ...(user.customClaims || {}), role });
    }

    const updated = await adminAuth.getUser(uid);
    const action = body.role !== undefined ? "ADMIN_ROLE_CHANGED" : body.disabled === true ? "ADMIN_DISABLED" : body.disabled === false ? "ADMIN_ENABLED" : "ADMIN_UPDATED";
    await recordAdminAudit(getAdminDb(), { actorUid: caller.uid, actorRole: caller.role!, action, entityType: "admin_user", entityId: uid, summary: body.role !== undefined ? `Changed admin role to ${role}` : body.disabled === true ? "Disabled admin account" : body.disabled === false ? "Enabled admin account" : "Updated admin account", metadata: { role: role || null, disabled: updated.disabled } });
    return NextResponse.json({ user: {
      uid: updated.uid,
      name: updated.displayName || updated.email?.split("@")[0] || "Admin",
      email: updated.email || "",
      role,
      disabled: updated.disabled,
      emailVerified: updated.emailVerified,
      createdAt: updated.metadata.creationTime || null,
      lastSignInAt: updated.metadata.lastSignInTime || null,
    }});
  } catch (error) {
    console.error("PATCH /api/admin/admin-users failed", error);
    return NextResponse.json({ error: "Unable to update admin account." }, { status: 500 });
  }
}
