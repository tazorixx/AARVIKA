import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase-admin";
import { releaseReservedInventory, type InventoryItemRequest } from "@/lib/checkout/inventory";
import { isCustomerCancellableStatus } from "@/lib/checkout/cancellation";
import { releaseDeliveryCapacity } from "@/lib/checkout/delivery-rules";
import { releaseCouponReservation } from "@/lib/checkout/coupon";

type CancelOrderResult =
  | { kind: "cancelled"; orderId: string }
  | { kind: "not_found" }
  | { kind: "forbidden" }
  | { kind: "not_cancellable"; status: string };

/**
 * Performs the complete cancellation transaction for an order.
 *
 * Cancellation is intentionally restricted to the same state currently
 * allowed by the customer flow (pending_payment). Paid/fulfillment orders
 * must continue through the existing shipment/refund operations instead of
 * bypassing those workflows.
 */
export async function cancelOrderTransactionally(options: {
  orderId: string;
  expectedUserId?: string;
}): Promise<CancelOrderResult> {
  const { orderId, expectedUserId } = options;
  const db = getAdminDb();
  const orderRef = db.collection("orders").doc(orderId);

  return db.runTransaction(async (tx) => {
    const snap = await tx.get(orderRef);
    if (!snap.exists) return { kind: "not_found" as const };

    const order = snap.data();
    if (expectedUserId && order?.userId !== expectedUserId) {
      return { kind: "forbidden" as const };
    }

    const status = typeof order?.status === "string" ? order.status.trim().toLowerCase() : "";
    if (!isCustomerCancellableStatus(status)) {
      return { kind: "not_cancellable" as const, status };
    }

    const items: InventoryItemRequest[] = Array.isArray(order?.items)
      ? order.items
          .map((it: Record<string, unknown>) => ({
            productId: String(it.productId || ""),
            qty: Math.max(1, Number(it.qty || it.quantity || 1)),
            title: typeof it.title === "string" ? it.title : undefined,
            deliveryDate: typeof it.deliveryDate === "string" ? it.deliveryDate : undefined,
            deliverySlot: typeof it.deliverySlot === "string" ? it.deliverySlot : undefined,
          }))
          .filter((it: InventoryItemRequest) => Boolean(it.productId))
      : [];

    if (items.length > 0) {
      await releaseReservedInventory(tx, db, items);
      await releaseDeliveryCapacity(tx, db, items);
    }
    if (order?.coupon?.code) {
      await releaseCouponReservation(tx, db, String(order.coupon.code), String(order.userId || ""));
    }

    tx.update(orderRef, {
      status: "cancelled",
      payment: {
        ...(order?.payment || {}),
        status: "cancelled",
      },
      cancelledAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return { kind: "cancelled" as const, orderId };
  });
}
