import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase-admin";
import { errorResponse, requireAdmin } from "@/lib/catalog/http";
import { recordAdminAudit } from "@/lib/admin/audit";

export const runtime = "nodejs";
const ROLES = ["SUPER_ADMIN", "ADMIN", "ORDER_MANAGER"] as const;
const STATUSES = new Set(["flagged", "contacted", "recovered", "dismissed"]);

function serialize(value: unknown) {
  const date = (value as { toDate?: () => Date } | undefined)?.toDate?.();
  return date instanceof Date ? date.toISOString() : value ?? null;
}

export async function GET(request: Request) {
  try {
    await requireAdmin(request, [...ROLES]);
    const url = new URL(request.url);
    const status = url.searchParams.get("status") || "all";
    const q = url.searchParams.get("q")?.trim().toLowerCase() || "";
    const snap = await getAdminDb().collection("abandoned_carts").orderBy("updatedAt", "desc").limit(500).get();
    let carts = snap.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        userId: data.userId || doc.id,
        customerEmail: data.customerEmail || null,
        customerName: data.customerName || null,
        items: Array.isArray(data.items) ? data.items : [],
        itemCount: Number(data.itemCount || 0),
        subtotal: Number(data.subtotal || 0),
        status: String(data.status || "flagged"),
        cartUpdatedAt: serialize(data.cartUpdatedAt),
        abandonedAt: serialize(data.abandonedAt),
        lastContactedAt: serialize(data.lastContactedAt),
        recoveredAt: serialize(data.recoveredAt),
        recoveredOrderId: data.recoveredOrderId || null,
        updatedAt: serialize(data.updatedAt),
      };
    });
    if (status !== "all") carts = carts.filter((cart) => cart.status === status);
    if (q) carts = carts.filter((cart) => [cart.id, cart.userId, cart.customerEmail, cart.customerName, cart.recoveredOrderId].filter(Boolean).join(" ").toLowerCase().includes(q));
    const summary = { total: carts.length, flagged: carts.filter((x) => x.status === "flagged").length, contacted: carts.filter((x) => x.status === "contacted").length, recovered: carts.filter((x) => x.status === "recovered").length, dismissed: carts.filter((x) => x.status === "dismissed").length, value: carts.filter((x) => x.status === "flagged" || x.status === "contacted").reduce((sum, x) => sum + x.subtotal, 0) };
    return NextResponse.json({ carts, summary });
  } catch (error) { return errorResponse(error); }
}

export async function PATCH(request: Request) {
  try {
    const caller = await requireAdmin(request, [...ROLES]);
    const body = await request.json() as { id?: unknown; status?: unknown };
    const id = typeof body.id === "string" ? body.id.trim() : "";
    const status = typeof body.status === "string" ? body.status.trim() : "";
    if (!id || !STATUSES.has(status)) return NextResponse.json({ error: "Valid cart ID and status are required." }, { status: 400 });
    const db = getAdminDb();
    const ref = db.collection("abandoned_carts").doc(id);
    const snap = await ref.get();
    if (!snap.exists) return NextResponse.json({ error: "Abandoned cart not found." }, { status: 404 });
    const updates: Record<string, unknown> = { status, updatedAt: FieldValue.serverTimestamp() };
    if (status === "contacted") updates.lastContactedAt = FieldValue.serverTimestamp();
    if (status === "recovered") updates.recoveredAt = FieldValue.serverTimestamp();
    await ref.update(updates);
    await recordAdminAudit(db, { actorUid: caller.uid, actorRole: caller.role!, action: "ABANDONED_CART_UPDATED", entityType: "abandoned_cart", entityId: id, summary: `Marked abandoned cart ${id} as ${status}`, metadata: { status } });
    return NextResponse.json({ ok: true });
  } catch (error) { return errorResponse(error); }
}
