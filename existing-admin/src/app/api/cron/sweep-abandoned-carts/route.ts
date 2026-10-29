import { NextResponse } from "next/server";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";
import { cronAuthorizationError } from "@/lib/cron/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const IDLE_MS = 2 * 60 * 60 * 1000;
const MAX_SCAN = 200;

export async function GET(request: Request) {
  try {
    const authError = cronAuthorizationError(request);
    if (authError) return authError;

    const db = getAdminDb();
    const cutoff = Timestamp.fromMillis(Date.now() - IDLE_MS);
    const snapshot = await db.collection("carts")
      .where("updatedAt", "<=", cutoff)
      .limit(MAX_SCAN)
      .get();

    let flagged = 0;
    let skipped = 0;

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const items = Array.isArray(data.items) ? data.items : [];
      const recoveryStatus = String(data.recoveryStatus || "active");
      if (!items.length || recoveryStatus === "flagged" || recoveryStatus === "contacted") {
        skipped += 1;
        continue;
      }

      const userId = doc.id;
      const user = await getAdminAuth().getUser(userId).catch(() => null);
      if (!user?.email) {
        skipped += 1;
        continue;
      }

      const subtotal = items.reduce((sum, item) => {
        const price = Number(item?.priceAtAdd || 0);
        const qty = Math.max(1, Number(item?.qty || item?.quantity || 1));
        return sum + (Number.isFinite(price) ? price * qty : 0);
      }, 0);

      await db.collection("abandoned_carts").doc(userId).set({
        userId,
        customerEmail: user.email,
        customerName: user.displayName || data.customerName || "Gift4U customer",
        items,
        itemCount: items.reduce((sum, item) => sum + Math.max(1, Number(item?.qty || item?.quantity || 1)), 0),
        subtotal,
        cartUpdatedAt: data.updatedAt || null,
        abandonedAt: FieldValue.serverTimestamp(),
        status: "flagged",
        lastContactedAt: null,
        recoveredAt: null,
        recoveredOrderId: null,
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });

      await doc.ref.set({
        recoveryStatus: "flagged",
        abandonedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
      flagged += 1;
    }

    return NextResponse.json({ ok: true, flagged, skipped, scanned: snapshot.size, cutoff: cutoff.toDate().toISOString() });
  } catch (error) {
    console.error("GET /api/cron/sweep-abandoned-carts failed:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Abandoned cart sweep failed." }, { status: 500 });
  }
}
