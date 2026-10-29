import type { Firestore, Transaction } from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";
import { releaseDeliveryCapacity } from "./delivery-rules";
import { releaseCouponReservation } from "./coupon";

export interface InventoryItemRequest {
  productId: string;
  qty: number;
  title?: string;
}

export interface ProductInventoryState {
  quantity: number;
  reserved: number;
  sold: number;
}

export function getAvailableStock(inventory?: Partial<ProductInventoryState>): number {
  const quantity = Math.max(0, Number(inventory?.quantity ?? 0));
  const reserved = Math.max(0, Number(inventory?.reserved ?? 0));
  return Math.max(0, quantity - reserved);
}

/**
 * Transactionally asserts stock availability and increments the `reserved` inventory.
 * Follows the reserve -> sold/available pattern established in Phase 1.
 */
export async function reserveInventory(
  tx: Transaction,
  db: Firestore,
  items: InventoryItemRequest[],
): Promise<void> {
  const productRefs = items.map((item) => db.collection("products").doc(item.productId));
  const productSnaps = await Promise.all(productRefs.map((ref) => tx.get(ref)));

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const snap = productSnaps[i];

    if (!snap.exists) {
      throw new Error(`Product "${item.title || item.productId}" is no longer available.`);
    }

    const data = snap.data();
    if (data?.status !== "live") {
      throw new Error(`Product "${data?.title || item.productId}" is not available for purchase.`);
    }

    const inventory: ProductInventoryState = {
      quantity: Math.max(0, Number(data?.inventory?.quantity ?? 0)),
      reserved: Math.max(0, Number(data?.inventory?.reserved ?? 0)),
      sold: Math.max(0, Number(data?.inventory?.sold ?? 0)),
    };

    const available = getAvailableStock(inventory);
    if (item.qty > available) {
      const productName = data?.title || item.title || "Selected item";
      throw new Error(
        available > 0
          ? `Only ${available} unit(s) of "${productName}" are currently available.`
          : `"${productName}" is currently out of stock.`
      );
    }

    tx.update(snap.ref, {
      "inventory.reserved": inventory.reserved + item.qty,
      updatedAt: FieldValue.serverTimestamp(),
    });
  }
}

/**
 * Transactionally transitions reserved inventory to sold:
 * decrements `reserved`, increments `sold`, and decrements total `quantity`.
 */
export async function commitSoldInventory(
  tx: Transaction,
  db: Firestore,
  items: InventoryItemRequest[],
): Promise<void> {
  const productRefs = items.map((item) => db.collection("products").doc(item.productId));
  const productSnaps = await Promise.all(productRefs.map((ref) => tx.get(ref)));

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const snap = productSnaps[i];

    if (!snap.exists) continue;

    const data = snap.data();
    const currentReserved = Math.max(0, Number(data?.inventory?.reserved ?? 0));
    const currentSold = Math.max(0, Number(data?.inventory?.sold ?? 0));
    const currentQty = Math.max(0, Number(data?.inventory?.quantity ?? 0));

    tx.update(snap.ref, {
      "inventory.reserved": Math.max(0, currentReserved - item.qty),
      "inventory.sold": currentSold + item.qty,
      "inventory.quantity": Math.max(0, currentQty - item.qty),
      updatedAt: FieldValue.serverTimestamp(),
    });
  }
}

/**
 * Transactionally releases reserved inventory back into available stock
 * when an order payment expires, cancels, or fails.
 */
export async function releaseReservedInventory(
  tx: Transaction,
  db: Firestore,
  items: InventoryItemRequest[],
): Promise<void> {
  const productRefs = items.map((item) => db.collection("products").doc(item.productId));
  const productSnaps = await Promise.all(productRefs.map((ref) => tx.get(ref)));

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const snap = productSnaps[i];

    if (!snap.exists) continue;

    const data = snap.data();
    const currentReserved = Math.max(0, Number(data?.inventory?.reserved ?? 0));

    tx.update(snap.ref, {
      "inventory.reserved": Math.max(0, currentReserved - item.qty),
      updatedAt: FieldValue.serverTimestamp(),
    });
  }
}

/**
 * Sweeps all pending_payment orders past their expiration timestamp (15-min TTL)
 * and transactionally releases their reserved inventory back to available.
 */
export async function sweepExpiredOrders(db: Firestore): Promise<number> {
  const now = new Date();
  const snapshot = await db
    .collection("orders")
    .where("status", "==", "pending_payment")
    .where("expiresAt", "<=", now)
    .limit(50)
    .get();

  let sweptCount = 0;

  for (const doc of snapshot.docs) {
    try {
      await db.runTransaction(async (tx) => {
        const freshSnap = await tx.get(doc.ref);
        if (!freshSnap.exists) return;

        const orderData = freshSnap.data();
        if (orderData?.status !== "pending_payment") return;

        const items: InventoryItemRequest[] = Array.isArray(orderData?.items)
          ? orderData.items.map((it: Record<string, unknown>) => ({
              productId: String(it.productId || ""),
              qty: Math.max(1, Number(it.qty || it.quantity || 1)),
              title: typeof it.title === "string" ? it.title : undefined,
              deliveryDate: typeof it.deliveryDate === "string" ? it.deliveryDate : undefined,
              deliverySlot: typeof it.deliverySlot === "string" ? it.deliverySlot : undefined,
            })).filter((it: InventoryItemRequest) => Boolean(it.productId))
          : [];

        if (items.length > 0) {
          await releaseReservedInventory(tx, db, items);
          await releaseDeliveryCapacity(tx, db, items);
        }
        if (orderData?.coupon?.code) {
          await releaseCouponReservation(tx, db, String(orderData.coupon.code), String(orderData.userId || ""));
        }

        tx.update(doc.ref, {
          status: "expired",
          expiredAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
      });

      sweptCount++;
    } catch (err) {
      console.error(`Failed to sweep expired order ${doc.id}:`, err);
    }
  }

  return sweptCount;
}
