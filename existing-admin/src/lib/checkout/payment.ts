import { FieldValue, type DocumentReference, type DocumentData, type Firestore } from "firebase-admin/firestore";
import { commitSoldInventory, releaseReservedInventory, type InventoryItemRequest } from "@/lib/checkout/inventory";
import { releaseDeliveryCapacity } from "@/lib/checkout/delivery-rules";
import { releaseCouponReservation } from "@/lib/checkout/coupon";

export type RazorpayPaymentOutcome = "captured" | "failed";

export type ProcessRazorpayPaymentEventInput = {
  db: Firestore;
  orderRef: Pick<DocumentReference, "id" | "path">;
  eventId: string;
  paymentId: string;
  razorpayOrderId: string;
  outcome: RazorpayPaymentOutcome;
  failureCode?: string;
  failureDescription?: string;
};

export type ProcessRazorpayPaymentEventResult =
  | { kind: "processed"; orderId: string; userId: string; status: "confirmed" | "payment_failed" }
  | { kind: "duplicate"; orderId: string; userId: string; status: string }
  | { kind: "ignored"; orderId: string; userId: string; status: string };

function getOrderItems(data: DocumentData | undefined): InventoryItemRequest[] {
  return Array.isArray(data?.items)
    ? data.items
        .map((item: Record<string, unknown>) => ({
          productId: String(item.productId || ""),
          qty: Math.max(1, Number(item.qty || item.quantity || 1)),
          title: typeof item.title === "string" ? item.title : undefined,
          deliveryDate: typeof item.deliveryDate === "string" ? item.deliveryDate : undefined,
          deliverySlot: typeof item.deliverySlot === "string" ? item.deliverySlot : undefined,
        }))
        .filter((item: InventoryItemRequest) => Boolean(item.productId))
    : [];
}

/**
 * Applies a verified Razorpay payment event atomically.
 *
 * The transaction reads the order, checks both the Razorpay payment ID and the
 * webhook event ID for prior processing, then records those IDs in the same
 * transaction that changes payment/order state and inventory.
 */
export async function processRazorpayPaymentEvent({
  db,
  orderRef,
  eventId,
  paymentId,
  razorpayOrderId,
  outcome,
  failureCode,
  failureDescription,
}: ProcessRazorpayPaymentEventInput): Promise<ProcessRazorpayPaymentEventResult> {
  if (!eventId || !paymentId || !razorpayOrderId) {
    throw new Error("Missing Razorpay event or payment identifiers.");
  }

  return db.runTransaction(async (tx) => {
    const snap = await tx.get(orderRef as DocumentReference);
    if (!snap.exists) throw new Error("Order not found.");

    const order = snap.data();
    const currentStatus = String(order?.status || "");
    const payment = (order?.payment || {}) as Record<string, unknown>;
    const storedPaymentId = typeof payment.paymentId === "string" ? payment.paymentId : "";
    const storedEventId = typeof payment.webhookEventId === "string" ? payment.webhookEventId : "";
    const storedRazorpayOrderId = typeof order?.razorpayOrderId === "string" ? order.razorpayOrderId : "";

    if (storedRazorpayOrderId && storedRazorpayOrderId !== razorpayOrderId) {
      throw new Error("Razorpay order ID does not match the Gift4U order.");
    }

    if (storedPaymentId === paymentId || storedEventId === eventId) {
      return { kind: "duplicate" as const, orderId: snap.id, userId: String(order?.userId || ""), status: currentStatus };
    }

    if (currentStatus === "confirmed" || currentStatus === "payment_failed" || currentStatus === "expired" || currentStatus === "cancelled") {
      return { kind: "ignored" as const, orderId: snap.id, userId: String(order?.userId || ""), status: currentStatus };
    }

    if (currentStatus !== "pending_payment") {
      throw new Error(`Order cannot process payment (current status: ${currentStatus}).`);
    }

    const items = getOrderItems(order);
    const commonPayment = {
      provider: "razorpay",
      orderId: razorpayOrderId,
      paymentId,
      webhookEventId: eventId,
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (outcome === "captured") {
      await commitSoldInventory(tx, db, items);
      tx.update(orderRef as DocumentReference, {
        status: "confirmed",
        payment: {
          ...payment,
          ...commonPayment,
          status: "captured",
          paidAt: FieldValue.serverTimestamp(),
        },
        expiresAt: FieldValue.delete(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      const userId = String(order?.userId || "");
      if (userId) {
        const abandonedRef = db.collection("abandoned_carts").doc(userId);
        const abandonedSnap = await tx.get(abandonedRef);
        if (abandonedSnap.exists && ["flagged", "contacted"].includes(String(abandonedSnap.data()?.status || ""))) {
          tx.update(abandonedRef, {
            status: "recovered",
            recoveredOrderId: snap.id,
            recoveredAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          });
        }
      }
      return { kind: "processed" as const, orderId: snap.id, userId: String(order?.userId || ""), status: "confirmed" as const };
    }

    await releaseReservedInventory(tx, db, items);
    await releaseDeliveryCapacity(tx, db, items);
    if (order?.coupon?.code) await releaseCouponReservation(tx, db, String(order.coupon.code), String(order?.userId || ""));
    tx.update(orderRef as DocumentReference, {
      status: "payment_failed",
      payment: {
        ...payment,
        ...commonPayment,
        status: "failed",
        failureCode: failureCode || null,
        failureDescription: failureDescription || null,
        failedAt: FieldValue.serverTimestamp(),
      },
      updatedAt: FieldValue.serverTimestamp(),
    });

    return { kind: "processed" as const, orderId: snap.id, userId: String(order?.userId || ""), status: "payment_failed" as const };
  });
}

export async function releaseOrderReservationAfterPaymentSetupFailure(
  db: Firestore,
  orderRef: DocumentReference,
): Promise<void> {
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(orderRef as DocumentReference);
    if (!snap.exists) return;

    const order = snap.data();
    if (order?.status !== "pending_payment") return;

    const items = getOrderItems(order);
    if (items.length > 0) {
      await releaseReservedInventory(tx, db, items);
      await releaseDeliveryCapacity(tx, db, items);
    }
    if (order?.coupon?.code) await releaseCouponReservation(tx, db, String(order.coupon.code), String(order?.userId || ""));

    tx.update(orderRef as DocumentReference, {
      status: "payment_setup_failed",
      payment: {
        provider: "razorpay",
        status: "setup_failed",
      },
      failedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  });
}
