import { createHash } from "node:crypto";

import type { CheckoutDeliverySelection } from "@/lib/checkout/types";

export const CHECKOUT_ATTEMPT_COLLECTION = "checkout_order_requests";

export function normalizeCheckoutRequestId(value: unknown) {
  if (typeof value !== "string") return "";
  const requestId = value.trim();
  return /^[A-Za-z0-9][A-Za-z0-9_-]{15,79}$/.test(requestId) ? requestId : "";
}

export function checkoutAttemptDocId(uid: string, requestId: string) {
  return createHash("sha256").update(`${uid}:${requestId}`).digest("hex");
}

export function hashCheckoutIntent(input: {
  addressId: string;
  delivery: CheckoutDeliverySelection[];
  couponCode?: string;
}) {
  const normalizedDelivery = [...(Array.isArray(input.delivery) ? input.delivery : [])]
    .map((item) => ({
      cartKey: String(item?.cartKey || ""),
      pincode: String(item?.pincode || ""),
      date: String(item?.date || ""),
      slot: String(item?.slot || ""),
    }))
    .sort((a, b) => a.cartKey.localeCompare(b.cartKey));

  return createHash("sha256").update(JSON.stringify({
    addressId: input.addressId,
    delivery: normalizedDelivery,
    couponCode: (input.couponCode || "").trim().toUpperCase(),
  })).digest("hex");
}

export async function sweepStaleCheckoutAttempts(db: FirebaseFirestore.Firestore) {
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const snapshot = await db.collection(CHECKOUT_ATTEMPT_COLLECTION)
    .where("createdAt", "<=", cutoff)
    .limit(200)
    .get();
  if (snapshot.empty) return 0;
  const batch = db.batch();
  for (const doc of snapshot.docs) batch.delete(doc.ref);
  await batch.commit();
  return snapshot.size;
}
