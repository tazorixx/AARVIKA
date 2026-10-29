import { FieldValue, type DocumentData, type Firestore, type Transaction } from "firebase-admin/firestore";

export type CouponType = "percent" | "fixed";

export type Coupon = {
  code: string;
  active: boolean;
  type: CouponType;
  value: number;
  minSubtotal?: number;
  maxDiscount?: number;
  usageLimit?: number;
  perUserLimit?: number;
  usedCount?: number;
  expiresAt?: unknown;
  startsAt?: unknown;
};

export type CouponResult = {
  valid: true;
  code: string;
  discount: number;
  type: CouponType;
  value: number;
} | {
  valid: false;
  error: string;
};

export function normalizeCouponCode(value: unknown) {
  return typeof value === "string" ? value.trim().toUpperCase().slice(0, 32) : "";
}

function toMillis(value: unknown) {
  if (!value) return null;
  if (typeof value === "object" && value !== null && "toMillis" in value && typeof (value as { toMillis?: unknown }).toMillis === "function") {
    return Number((value as { toMillis: () => number }).toMillis());
  }
  if (value instanceof Date) return value.getTime();
  const parsed = new Date(String(value)).getTime();
  return Number.isFinite(parsed) ? parsed : null;
}

export function parseCoupon(data: DocumentData | undefined, fallbackCode: string): Coupon | null {
  if (!data || typeof data !== "object") return null;
  const type = data.type === "percent" || data.type === "fixed" ? data.type : null;
  const value = Number(data.value);
  if (!type || !Number.isFinite(value) || value <= 0) return null;
  return {
    code: normalizeCouponCode(data.code || fallbackCode),
    active: data.active !== false,
    type,
    value,
    minSubtotal: Math.max(0, Number(data.minSubtotal || 0)),
    maxDiscount: Number.isFinite(Number(data.maxDiscount)) && Number(data.maxDiscount) > 0 ? Number(data.maxDiscount) : undefined,
    usageLimit: Number.isFinite(Number(data.usageLimit)) && Number(data.usageLimit) > 0 ? Math.floor(Number(data.usageLimit)) : undefined,
    perUserLimit: Number.isFinite(Number(data.perUserLimit)) && Number(data.perUserLimit) > 0 ? Math.floor(Number(data.perUserLimit)) : undefined,
    usedCount: Math.max(0, Number(data.usedCount || 0)),
    expiresAt: data.expiresAt,
    startsAt: data.startsAt,
  };
}

export function calculateCouponDiscount(coupon: Coupon, subtotal: number, now = Date.now()): CouponResult {
  if (!coupon.active) return { valid: false, error: "This coupon is no longer active." };
  const startsAt = toMillis(coupon.startsAt);
  if (startsAt !== null && now < startsAt) return { valid: false, error: "This coupon is not active yet." };
  const expiresAt = toMillis(coupon.expiresAt);
  if (expiresAt !== null && now > expiresAt) return { valid: false, error: "This coupon has expired." };
  if (coupon.usageLimit !== undefined && (coupon.usedCount || 0) >= coupon.usageLimit) return { valid: false, error: "This coupon has reached its usage limit." };
  if (subtotal < (coupon.minSubtotal || 0)) return { valid: false, error: `Add ${formatRupees((coupon.minSubtotal || 0) - subtotal)} more to use this coupon.` };

  let discount = coupon.type === "percent" ? subtotal * (coupon.value / 100) : coupon.value;
  if (coupon.maxDiscount !== undefined) discount = Math.min(discount, coupon.maxDiscount);
  discount = Math.max(0, Math.min(subtotal, Math.round(discount * 100) / 100));
  if (discount <= 0) return { valid: false, error: "This coupon does not apply to the current cart." };

  return { valid: true, code: coupon.code, discount, type: coupon.type, value: coupon.value };
}

function formatRupees(value: number) {
  return `₹${Math.ceil(Math.max(0, value)).toLocaleString("en-IN")}`;
}

export async function releaseCouponReservation(
  tx: Transaction,
  db: Firestore,
  code: string,
  uid: string,
) {
  const normalized = normalizeCouponCode(code);
  if (!normalized || !uid) return;
  const couponRef = db.collection("coupons").doc(normalized);
  const redemptionRef = couponRef.collection("redemptions").doc(uid);
  const couponSnapshot = await tx.get(couponRef);
  const redemptionSnapshot = await tx.get(redemptionRef);
  if (!couponSnapshot.exists) return;
  const usedCount = Math.max(0, Number(couponSnapshot.data()?.usedCount || 0));
  const userCount = Math.max(0, Number(redemptionSnapshot.data()?.count || 0));
  tx.update(couponRef, { usedCount: Math.max(0, usedCount - 1), updatedAt: FieldValue.serverTimestamp() });
  if (redemptionSnapshot.exists) {
    tx.update(redemptionRef, { count: Math.max(0, userCount - 1), updatedAt: FieldValue.serverTimestamp() });
  }
}
