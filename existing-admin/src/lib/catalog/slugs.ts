import type { Firestore, Transaction } from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";

export function slugLockId(type: string, slug: string) {
  return `${type}_${slug}`;
}

export function slugLockRef(
  db: Firestore,
  type: string,
  slug: string,
) {
  return db.collection("slugs").doc(slugLockId(type, slug));
}

export function assertSlugAvailable(
  snap: FirebaseFirestore.DocumentSnapshot,
  entityId: string,
) {
  if (snap.exists && snap.data()?.entityId !== entityId) {
    throw new Error("Slug is already in use.");
  }
}

export function writeSlugLock(
  tx: Transaction,
  db: Firestore,
  type: string,
  slug: string,
  entityId: string,
) {
  const ref = slugLockRef(db, type, slug);

  tx.set(
    ref,
    {
      type,
      slug,
      entityId,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  return ref;
}

export function deleteSlugLockIfOwned(
  tx: Transaction,
  db: Firestore,
  type: string,
  slug: string,
  entityId: string,
  snap: FirebaseFirestore.DocumentSnapshot,
) {
  if (snap.exists && snap.data()?.entityId === entityId) {
    tx.delete(slugLockRef(db, type, slug));
  }
}

/**
 * Backwards-compatible standalone slug reservation helper.
 *
 * New catalog mutations should use the transaction primitives above
 * so the slug lock and entity mutation are atomic.
 */
export async function reserveSlug(
  type: string,
  slug: string,
  entityId: string,
) {
  const { getAdminDb } = await import("../firebase-admin");

  const db = getAdminDb();
  const ref = slugLockRef(db, type, slug);

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);

    assertSlugAvailable(snap, entityId);

    writeSlugLock(
      tx,
      db,
      type,
      slug,
      entityId,
    );
  });
}

/**
 * Backwards-compatible standalone slug release helper.
 */
export async function releaseSlug(
  type: string,
  slug: string,
  entityId: string,
) {
  const { getAdminDb } = await import("../firebase-admin");

  const db = getAdminDb();
  const ref = slugLockRef(db, type, slug);

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);

    if (
      snap.exists &&
      snap.data()?.entityId === entityId
    ) {
      tx.delete(ref);
    }
  });
}