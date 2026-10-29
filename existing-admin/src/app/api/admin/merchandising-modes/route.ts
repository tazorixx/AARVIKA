import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase-admin";
import { errorResponse, requireAdmin } from "@/lib/catalog/http";
import { DEFAULT_MERCHANDISING, MERCHANDISING_ADMIN_ROLES, MERCHANDISING_KEYS, MerchandisingKey, normalizeMerchandisingSetting } from "@/lib/admin/merchandising-modes";

export const runtime = "nodejs";
const collection = "merchandising_settings";

export async function GET(request: Request) {
  try {
    await requireAdmin(request, [...MERCHANDISING_ADMIN_ROLES]);
    const db = getAdminDb();
    const snap = await db.collection(collection).get();
    const map = new Map(snap.docs.map((d) => [d.id, d.data()]));
    return NextResponse.json({ settings: MERCHANDISING_KEYS.map((key) => normalizeMerchandisingSetting(key, map.get(key))) });
  } catch (error) { return errorResponse(error); }
}

export async function PATCH(request: Request) {
  try {
    const actor = await requireAdmin(request, [...MERCHANDISING_ADMIN_ROLES]);
    const body = await request.json() as Record<string, unknown>;
    const key = String(body.key || "") as MerchandisingKey;
    if (!MERCHANDISING_KEYS.includes(key)) return NextResponse.json({ error: "Invalid merchandising key." }, { status: 400 });
    const mode = body.mode === "manual" ? "manual" : body.mode === "automatic" ? "automatic" : null;
    if (!mode) return NextResponse.json({ error: "Invalid merchandising mode." }, { status: 400 });
    const productIds = Array.isArray(body.productIds) ? body.productIds.filter((id): id is string => typeof id === "string").slice(0, 20) : [];
    const limit = Math.min(Math.max(Number(body.limit) || 4, 1), 12);
    const active = body.active !== false;
    const ref = getAdminDb().collection(collection).doc(key);
    await ref.set({ key, mode, productIds, limit, active, updatedAt: FieldValue.serverTimestamp(), updatedBy: actor.uid }, { merge: true });
    return NextResponse.json({ ok: true, setting: normalizeMerchandisingSetting(key, { key, mode, productIds, limit, active }) });
  } catch (error) { return errorResponse(error); }
}
