import { NextResponse } from "next/server";
import { getAdminDb, verifyBearerToken } from "@/lib/firebase-admin";
import { getCartQuantity, type CartItem } from "@/lib/cart/types";
import { calculateCouponDiscount, normalizeCouponCode, parseCoupon } from "@/lib/checkout/coupon";
import { validateCartPriceSnapshots } from "@/lib/checkout/order-pricing";

export async function POST(request: Request) {
  try {
    const { uid } = await verifyBearerToken(request);
    const body = (await request.json()) as { code?: unknown };
    const code = normalizeCouponCode(body.code);
    if (!code) return NextResponse.json({ valid: false, error: "Enter a coupon code." }, { status: 400 });

    const db = getAdminDb();
    const cartSnapshot = await db.collection("carts").doc(uid).get();
    const items = Array.isArray(cartSnapshot.data()?.items) ? (cartSnapshot.data()?.items as CartItem[]) : [];
    if (!items.length) return NextResponse.json({ valid: false, error: "Your cart is empty." }, { status: 400 });

    const priceValidation = validateCartPriceSnapshots(items);
    if (!priceValidation.valid) return NextResponse.json({ valid: false, error: priceValidation.message }, { status: 400 });

    const subtotal = items.reduce((sum, item) => sum + Number(item.priceAtAdd) * getCartQuantity(item), 0);
    const couponSnapshot = await db.collection("coupons").doc(code).get();
    const coupon = parseCoupon(couponSnapshot.data(), code);
    if (!coupon) return NextResponse.json({ valid: false, error: "This coupon code is not valid." }, { status: 400 });

    const redemptionSnapshot = await couponSnapshot.ref.collection("redemptions").doc(uid).get();
    const userUses = Math.max(0, Number(redemptionSnapshot.data()?.count || 0));
    if (coupon.perUserLimit !== undefined && userUses >= coupon.perUserLimit) {
      return NextResponse.json({ valid: false, error: "You have already used this coupon the maximum number of times." }, { status: 400 });
    }

    const result = calculateCouponDiscount(coupon, subtotal);
    if (!result.valid) return NextResponse.json(result, { status: 400 });

    return NextResponse.json({ valid: true, code: result.code, discount: result.discount, subtotal, grandTotal: subtotal - result.discount }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("POST /api/checkout/coupon failed", error);
    const message = error instanceof Error ? error.message : "Unable to validate coupon.";
    if (message === "Missing bearer token." || message === "Invalid token.") {
      return NextResponse.json({ valid: false, error: "Please sign in before using a coupon." }, { status: 401 });
    }
    return NextResponse.json({ valid: false, error: "Unable to validate coupon right now." }, { status: 500 });
  }
}
