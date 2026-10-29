import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase-admin";
import { errorResponse, requireAdmin } from "@/lib/catalog/http";
import { normalizeCouponCode } from "@/lib/checkout/coupon";
import { validateCouponInput } from "@/lib/admin/coupons";

export const runtime = "nodejs";

export async function PATCH(request: Request, { params }: { params: Promise<{ couponId: string }> }) {
  try {
    await requireAdmin(request, ["SUPER_ADMIN", "ADMIN", "CATALOG_MANAGER"]);
    const id = normalizeCouponCode((await params).couponId); const ref = getAdminDb().collection("coupons").doc(id); const current = await ref.get();
    if (!current.exists) return NextResponse.json({ error: "Coupon not found." }, { status: 404 });
    const body = await request.json();
    if (Object.keys(body).length === 1 && typeof body.active === "boolean") { await ref.update({ active: body.active, updatedAt: FieldValue.serverTimestamp() }); return NextResponse.json({ ok: true }); }
    const parsed = validateCouponInput({ ...current.data(), ...body, code: id });
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
    await ref.update({ ...parsed.value, updatedAt: FieldValue.serverTimestamp() });
    return NextResponse.json({ ok: true });
  } catch (error) { return errorResponse(error); }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ couponId: string }> }) {
  try {
    await requireAdmin(request, ["SUPER_ADMIN", "ADMIN"]);
    const id = normalizeCouponCode((await params).couponId); const ref = getAdminDb().collection("coupons").doc(id); const snap = await ref.get();
    if (!snap.exists) return NextResponse.json({ error: "Coupon not found." }, { status: 404 });
    const usedCount = Number(snap.data()?.usedCount || 0);
    if (usedCount > 0) return NextResponse.json({ error: "Used coupons cannot be deleted. Disable the coupon instead." }, { status: 400 });
    await ref.delete(); return NextResponse.json({ ok: true });
  } catch (error) { return errorResponse(error); }
}
