import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireAdmin, errorResponse } from "@/lib/catalog/http";
import { ORDER_ADMIN_ROLES } from "@/lib/admin/orders";

export const runtime = "nodejs";

function serializeTimestamp(value: unknown) {
  const date = (value as { toDate?: () => Date } | undefined)?.toDate?.();
  return date instanceof Date ? date.toISOString() : null;
}

type OrderAddress = {
  name?: unknown;
  phone?: unknown;
  pincode?: unknown;
};

type OrderListData = Record<string, unknown> & {
  userId?: unknown;
  address?: OrderAddress;
};

export async function GET(request: Request) {
  try {
    await requireAdmin(request, ORDER_ADMIN_ROLES);
    const url = new URL(request.url);
    const status = url.searchParams.get("status")?.trim();
    const q = url.searchParams.get("q")?.trim().toLowerCase() || "";
    const requestedLimit = Number(url.searchParams.get("limit") || 25);
    const limit = Math.max(1, Math.min(50, Number.isFinite(requestedLimit) ? Math.floor(requestedLimit) : 25));
    const cursor = url.searchParams.get("cursor");
    const db = getAdminDb();

    let query: FirebaseFirestore.Query = db.collection("orders").orderBy("createdAt", "desc").limit(limit);
    if (status) query = db.collection("orders").where("status", "==", status).orderBy("createdAt", "desc").limit(limit);
    if (cursor) {
      const cursorDoc = await db.collection("orders").doc(cursor).get();
      if (cursorDoc.exists) query = query.startAfter(cursorDoc);
    }

    const snap = await query.get();
    let orders = snap.docs.map((doc) => {
      const data = doc.data() as OrderListData;
      return {
        id: doc.id,
        ...data,
        createdAt: serializeTimestamp(data.createdAt),
        updatedAt: serializeTimestamp(data.updatedAt),
        expiresAt: serializeTimestamp(data.expiresAt),
      };
    });

    if (q) {
      orders = orders.filter((order) => {
        const haystack = [order.id, order.userId, order.address?.name, order.address?.phone, order.address?.pincode]
          .filter(Boolean).join(" ").toLowerCase();
        return haystack.includes(q);
      });
    }

    const confirmed = await db.collection("orders").where("status", "==", "confirmed").get();
    const revenue = confirmed.docs.reduce((sum, doc) => sum + Number(doc.data().totals?.grandTotal || 0), 0);

    return NextResponse.json({
      orders,
      nextCursor: snap.docs.length === limit ? snap.docs[snap.docs.length - 1]?.id || null : null,
      metrics: { totalRevenue: revenue, confirmedOrders: confirmed.size },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
