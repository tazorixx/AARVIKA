import { NextResponse } from "next/server";
import { getAdminDb, verifyBearerToken } from "@/lib/firebase-admin";
import { getCustomerOrderStatusLabel, isCustomerCancellableStatus, normalizeCustomerOrderStatus } from "@/lib/checkout/cancellation";

function serializeTimestamp(value: unknown) {
  if (value && typeof value === "object" && "toDate" in value && typeof (value as { toDate?: unknown }).toDate === "function") {
    const date = (value as { toDate: () => Date }).toDate();
    return date.toISOString();
  }
  if (value instanceof Date) return value.toISOString();
  return typeof value === "string" ? value : null;
}

function serializeOrder(doc: { id: string; data: () => Record<string, unknown> }) {
  const data = doc.data();
  const status = normalizeCustomerOrderStatus(data.status) ?? String(data.status || "unknown");
  const totals = data.totals && typeof data.totals === "object" ? data.totals as Record<string, unknown> : {};

  return {
    id: doc.id,
    status,
    statusLabel: getCustomerOrderStatusLabel(status),
    cancellationAllowed: isCustomerCancellableStatus(status),
    items: Array.isArray(data.items) ? data.items : [],
    totals: {
      subtotal: Math.max(0, Number(totals.subtotal || 0)),
      delivery: Math.max(0, Number(totals.delivery || 0)),
      discount: Math.max(0, Number(totals.discount || 0)),
      tax: Math.max(0, Number(totals.tax || 0)),
      grandTotal: Math.max(0, Number(totals.grandTotal || 0)),
    },
    coupon: data.coupon || null,
    address: data.address || null,
    payment: data.payment || null,
    refund: data.refund || null,
    createdAt: serializeTimestamp(data.createdAt),
    updatedAt: serializeTimestamp(data.updatedAt),
    cancelledAt: serializeTimestamp(data.cancelledAt),
    expiredAt: serializeTimestamp(data.expiredAt),
  };
}

export async function GET(request: Request) {
  try {
    const { uid } = await verifyBearerToken(request);
    const db = getAdminDb();

    const snapshot = await db.collection("orders").where("userId", "==", uid).get();
    const orders = snapshot.docs
      .map(serializeOrder)
      .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));

    return NextResponse.json({ orders });
  } catch (error) {
    console.error("GET /api/account/orders failed:", error);
    return NextResponse.json({ error: "Unable to load your orders." }, { status: 401 });
  }
}
