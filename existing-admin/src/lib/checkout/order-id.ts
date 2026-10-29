import type { Firestore, Transaction } from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";

/**
 * Generates a collision-safe, sequential order ID using an atomic transaction counter
 * following the exact locking pattern established in src/lib/catalog/slugs.ts.
 *
 * Format: G4U-YYMM-XXXXX (e.g. G4U-2609-00001)
 */
export async function generateTransactionalOrderId(
  tx: Transaction,
  db: Firestore,
): Promise<string> {
  const now = new Date();
  const year = String(now.getFullYear()).slice(-2);
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const period = `${year}${month}`;

  const counterRef = db.collection("order_counters").doc(`orders_${period}`);
  const counterSnap = await tx.get(counterRef);

  let nextSequence = 1;
  if (counterSnap.exists) {
    const current = Number(counterSnap.data()?.sequence ?? 0);
    nextSequence = Number.isFinite(current) ? current + 1 : 1;
  }

  const paddedSequence = String(nextSequence).padStart(5, "0");
  const orderId = `G4U-${period}-${paddedSequence}`;

  const lockRef = db.collection("order_locks").doc(orderId);
  const lockSnap = await tx.get(lockRef);

  if (lockSnap.exists) {
    throw new Error(`Order ID collision detected for ${orderId}. Retry transaction.`);
  }

  tx.set(
    counterRef,
    {
      period,
      sequence: nextSequence,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  tx.set(lockRef, {
    orderId,
    createdAt: FieldValue.serverTimestamp(),
  });

  return orderId;
}
