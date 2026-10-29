import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase-admin";
import { errorResponse, requireAdmin } from "@/lib/catalog/http";
import { normalizeDeliveryZoneInput } from "@/lib/checkout/delivery-zones";
import { recordAdminAudit } from "@/lib/admin/audit";

export const runtime = "nodejs";
const ZONE_ROLES = ["SUPER_ADMIN", "ADMIN", "ORDER_MANAGER"] as const;

function validateZone(value: unknown, id: string) {
  const zone = normalizeDeliveryZoneInput(value, id);
  if (!zone.name) return { ok: false as const, error: "Zone name is required." };
  if (!zone.pincodes.length && !zone.cities.length) return { ok: false as const, error: "Add at least one pincode or city." };
  if (zone.delivery.maxDays !== undefined && zone.delivery.maxDays < (zone.delivery.minDays ?? 0)) return { ok: false as const, error: "Maximum delivery days cannot be below minimum delivery days." };
  return { ok: true as const, value: zone };
}

export async function PATCH(request: Request, context: { params: Promise<{ zoneId: string }> }) {
  try {
    const caller = await requireAdmin(request, [...ZONE_ROLES]);
    const { zoneId } = await context.params;
    const parsed = validateZone(await request.json(), zoneId);
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
    const db = getAdminDb(); const ref = db.collection("delivery_zones").doc(zoneId);
    if (!(await ref.get()).exists) return NextResponse.json({ error: "Delivery zone not found." }, { status: 404 });
    await ref.set({ ...parsed.value, id: zoneId, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    await recordAdminAudit(db, { actorUid: caller.uid, actorRole: caller.role!, action: "DELIVERY_ZONE_UPDATED", entityType: "delivery_zone", entityId: zoneId, summary: `Updated delivery zone ${parsed.value.name}` });
    return NextResponse.json({ id: zoneId });
  } catch (error) { return errorResponse(error); }
}

export async function DELETE(request: Request, context: { params: Promise<{ zoneId: string }> }) {
  try {
    const caller = await requireAdmin(request, [...ZONE_ROLES]);
    const { zoneId } = await context.params;
    const db = getAdminDb(); const ref = db.collection("delivery_zones").doc(zoneId);
    if (!(await ref.get()).exists) return NextResponse.json({ error: "Delivery zone not found." }, { status: 404 });
    const snapshot = await ref.get();
    await ref.delete();
    await recordAdminAudit(db, { actorUid: caller.uid, actorRole: caller.role!, action: "DELIVERY_ZONE_DELETED", entityType: "delivery_zone", entityId: zoneId, summary: `Deleted delivery zone ${String(snapshot.data()?.name || zoneId)}` });
    return NextResponse.json({ ok: true });
  } catch (error) { return errorResponse(error); }
}
