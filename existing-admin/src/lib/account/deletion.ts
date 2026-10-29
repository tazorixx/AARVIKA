import { randomUUID } from "node:crypto";
import { FieldValue, type DocumentReference, type Firestore, type QueryDocumentSnapshot } from "firebase-admin/firestore";

import { getAdminAuth } from "@/lib/firebase-admin";

const ACTIVE_ORDER_STATUSES = new Set([
  "pending_payment",
  "confirmed",
  "processing",
  "packed",
  "shipped",
  "out_for_delivery",
  "delivery_failed",
  "returned",
]);

export class AccountDeletionError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "AccountDeletionError";
  }
}

function normalizeStatus(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

async function commitDeletes(db: Firestore, refs: DocumentReference[]) {
  let deleted = 0;
  for (let index = 0; index < refs.length; index += 400) {
    const batch = db.batch();
    const chunk = refs.slice(index, index + 400);
    for (const ref of chunk) batch.delete(ref);
    await batch.commit();
    deleted += chunk.length;
  }
  return deleted;
}

async function deleteReviewAndUpdateAggregate(db: Firestore, review: QueryDocumentSnapshot) {
  await db.runTransaction(async (tx) => {
    const fresh = await tx.get(review.ref);
    if (!fresh.exists) return;
    const data = fresh.data() || {};
    const productId = typeof data.productId === "string" ? data.productId : "";
    const approved = data.status === "approved";
    const ratingValue = Math.min(5, Math.max(1, Number(data.rating || 0)));
    const productRef = productId ? db.collection("products").doc(productId) : null;
    const product = approved && productRef ? await tx.get(productRef) : null;

    if (product?.exists && productRef) {
      const productData = product.data() || {};
      const count = Math.max(0, Number(productData.reviewCount || 0));
      const average = Math.max(0, Number(productData.rating || 0));
      const nextCount = Math.max(0, count - 1);
      const nextAverage = nextCount > 0
        ? Math.max(0, ((average * count) - ratingValue) / nextCount)
        : 0;
      tx.update(productRef, {
        reviewCount: nextCount,
        rating: nextAverage,
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    tx.delete(fresh.ref);
  });
}

async function deleteReviewReport(db: Firestore, report: QueryDocumentSnapshot) {
  await db.runTransaction(async (tx) => {
    const fresh = await tx.get(report.ref);
    if (!fresh.exists) return;
    const data = fresh.data() || {};
    const reviewId = typeof data.reviewId === "string" ? data.reviewId : "";
    const reviewRef = reviewId ? db.collection("reviews").doc(reviewId) : null;
    const review = reviewRef ? await tx.get(reviewRef) : null;
    if (review?.exists && reviewRef) {
      const count = Math.max(0, Number(review.data()?.reportCount || 0));
      tx.update(reviewRef, {
        reportCount: Math.max(0, count - 1),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
    tx.delete(fresh.ref);
  });
}

function anonymizeOrderItems(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map((raw) => {
    const item = raw && typeof raw === "object" ? raw as Record<string, unknown> : {};
    const retained = { ...item };
    delete retained.personalization;
    delete retained.giftMessage;
    return retained;
  });
}

export async function deleteCustomerAccount(db: Firestore, uid: string) {
  const orderSnapshot = await db.collection("orders").where("userId", "==", uid).get();
  const activeOrders = orderSnapshot.docs
    .map((doc) => ({ id: doc.id, status: normalizeStatus(doc.data()?.status) }))
    .filter((order) => ACTIVE_ORDER_STATUSES.has(order.status));

  if (activeOrders.length > 0) {
    throw new AccountDeletionError(
      409,
      "ACTIVE_ORDERS_BLOCK_DELETION",
      "Account deletion is unavailable while you have an active or unresolved order. Finish or resolve those orders first, then try again.",
      { orders: activeOrders.slice(0, 20) },
    );
  }

  const [addressSnapshot, reviewSnapshot, reportSnapshot, supportSnapshot, pushSnapshot, notificationSnapshot, checkoutAttemptSnapshot] = await Promise.all([
    db.collection("users").doc(uid).collection("addresses").get(),
    db.collection("reviews").where("userId", "==", uid).get(),
    db.collection("review_reports").where("userId", "==", uid).get(),
    db.collection("support_tickets").where("userId", "==", uid).get(),
    db.collection("mobile_push_tokens").where("userId", "==", uid).get(),
    db.collection("notifications").where("userId", "==", uid).get(),
    db.collection("checkout_order_requests").where("userId", "==", uid).get(),
  ]);

  // Reviews affect public product aggregates, so remove them transactionally.
  for (const review of reviewSnapshot.docs) await deleteReviewAndUpdateAggregate(db, review);
  for (const report of reportSnapshot.docs) await deleteReviewReport(db, report);

  await commitDeletes(db, [
    ...addressSnapshot.docs.map((doc) => doc.ref),
    ...supportSnapshot.docs.map((doc) => doc.ref),
    ...pushSnapshot.docs.map((doc) => doc.ref),
    ...notificationSnapshot.docs.map((doc) => doc.ref),
    ...checkoutAttemptSnapshot.docs.map((doc) => doc.ref),
  ]);

  // Coupon usage is stored below coupon documents rather than in one user collection.
  // Delete the authenticated user's redemption marker for every coupon without reading
  // or exposing coupon internals to the client.
  const coupons = await db.collection("coupons").get();
  await commitDeletes(db, coupons.docs.map((doc) => doc.ref.collection("redemptions").doc(uid)));

  const orderRefs = orderSnapshot.docs;
  for (let index = 0; index < orderRefs.length; index += 200) {
    const batch = db.batch();
    const chunk = orderRefs.slice(index, index + 200);
    for (const order of chunk) {
      const data = order.data() || {};
      batch.update(order.ref, {
        userId: `deleted-${randomUUID()}`,
        address: {
          name: "Deleted customer",
          phone: "",
          addressLine: "",
          city: "",
          state: "",
          pincode: "",
        },
        items: anonymizeOrderItems(data.items),
        accountDeletedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
    await batch.commit();
  }

  await commitDeletes(db, [
    db.collection("carts").doc(uid),
    db.collection("wishlists").doc(uid),
    db.collection("abandoned_carts").doc(uid),
    db.collection("users").doc(uid),
  ]);

  // Authentication is deleted last. If any earlier cleanup fails, the customer can
  // retry the authenticated request rather than being locked out midway through cleanup.
  await getAdminAuth().deleteUser(uid).catch((error: unknown) => {
    const code = error && typeof error === "object" && "code" in error ? String((error as { code?: unknown }).code || "") : "";
    if (code !== "auth/user-not-found") throw error;
  });

  return {
    deleted: true as const,
    retainedOrderRecords: orderSnapshot.size,
    deletedReviews: reviewSnapshot.size,
    deletedSupportTickets: supportSnapshot.size,
  };
}
