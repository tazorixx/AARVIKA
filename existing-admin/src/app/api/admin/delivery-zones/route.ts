import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase-admin";
import { errorResponse, requireAdmin } from "@/lib/catalog/http";
import { normalizeDeliveryZoneInput } from "@/lib/checkout/delivery-zones";
import { recordAdminAudit } from "@/lib/admin/audit";

export const runtime = "nodejs";
const ZONE_ROLES = ["SUPER_ADMIN", "ADMIN", "ORDER_MANAGER"] as const;

function validateZone(value: unknown) {
  const zone = normalizeDeliveryZoneInput(value);
  if (!zone.name) return { ok: false as const, error: "Zone name is required." };
  if (!zone.pincodes.length && !zone.cities.length) return { ok: false as const, error: "Add at least one pincode or city." };
  if (zone.delivery.maxDays !== undefined && zone.delivery.maxDays < (zone.delivery.minDays ?? 0)) return { ok: false as const, error: "Maximum delivery days cannot be below minimum delivery days." };
  return { ok: true as const, value: zone };
}

function serialize(value: unknown): unknown {
  if (value && typeof value === "object" && "toDate" in value && typeof (value as { toDate?: unknown }).toDate === "function") {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  return value;
}

export async function GET(request: Request) {
  try {
    await requireAdmin(request, [...ZONE_ROLES]);
    const snap = await getAdminDb().collection("delivery_zones").orderBy("name").limit(500).get();
    return NextResponse.json(snap.docs.map((doc) => {
      const data = normalizeDeliveryZoneInput(doc.data(), doc.id);
      return { ...data, createdAt: serialize(data.createdAt), updatedAt: serialize(data.updatedAt) };
    }));
  } catch (error) { return errorResponse(error); }
}

export async function POST(request: Request) {
  try {
    const caller = await requireAdmin(request, [...ZONE_ROLES]);
    const parsed = validateZone(await request.json());
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
    const db = getAdminDb();
    const existing = await db.collection("delivery_zones").where("name", "==", parsed.value.name).limit(1).get();
    if (!existing.empty) return NextResponse.json({ error: "A delivery zone with this name already exists." }, { status: 409 });
    const ref = db.collection("delivery_zones").doc();
    await ref.set({ ...parsed.value, id: ref.id, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
    await recordAdminAudit(db, { actorUid: caller.uid, actorRole: caller.role!, action: "DELIVERY_ZONE_CREATED", entityType: "delivery_zone", entityId: ref.id, summary: `Created delivery zone ${parsed.value.name}` });
    return NextResponse.json({ id: ref.id }, { status: 201 });
  } catch (error) { return errorResponse(error); }
}
