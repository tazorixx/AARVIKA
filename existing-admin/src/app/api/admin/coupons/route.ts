import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase-admin";
import { errorResponse, requireAdmin } from "@/lib/catalog/http";
import { normalizeCouponCode, parseCoupon } from "@/lib/checkout/coupon";
import { validateCouponInput } from "@/lib/admin/coupons";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    await requireAdmin(request, ["SUPER_ADMIN", "ADMIN", "CATALOG_MANAGER"]);
    const snap = await getAdminDb().collection("coupons").limit(200).get();
    return NextResponse.json(snap.docs.map((doc) => { const parsed = parseCoupon(doc.data(), doc.id); return parsed ? { id: doc.id, ...parsed, usedCount: Number(doc.data().usedCount || 0) } : { id: doc.id, code: doc.id, active: false, invalid: true, usedCount: Number(doc.data().usedCount || 0) }; }));
  } catch (error) { return errorResponse(error); }
}

export async function POST(request: Request) {
  try {
    await requireAdmin(request, ["SUPER_ADMIN", "ADMIN", "CATALOG_MANAGER"]);
    const parsed = validateCouponInput(await request.json());
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
    const db = getAdminDb(); const ref = db.collection("coupons").doc(normalizeCouponCode(parsed.value.code));
    if ((await ref.get()).exists) return NextResponse.json({ error: "A coupon with this code already exists." }, { status: 409 });
    await ref.set({ ...parsed.value, usedCount: 0, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
    return NextResponse.json({ id: ref.id }, { status: 201 });
  } catch (error) { return errorResponse(error); }
}
