import { NextResponse } from "next/server";
import { getAdminDb, verifyBearerToken } from "@/lib/firebase-admin";
import { getCustomerOrderStatusLabel, isCustomerCancellableStatus, normalizeCustomerOrderStatus } from "@/lib/checkout/cancellation";

function serializeTimestamp(value: unknown) {
  if (value && typeof value === "object" && "toDate" in value && typeof (value as { toDate?: unknown }).toDate === "function") {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  if (value instanceof Date) return value.toISOString();
  return typeof value === "string" ? value : null;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> },
) {
  try {
    const { uid } = await verifyBearerToken(request);
    const { orderId } = await params;
    const normalizedOrderId = orderId?.trim();

    if (!normalizedOrderId) {
      return NextResponse.json({ error: "Missing order ID." }, { status: 400 });
    }

    const db = getAdminDb();
    const doc = await db.collection("orders").doc(normalizedOrderId).get();

    if (!doc.exists) return NextResponse.json({ error: "Order not found." }, { status: 404 });

    const data = doc.data() || {};
    if (data.userId !== uid) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 403 });
    }

    const status = normalizeCustomerOrderStatus(data.status) ?? String(data.status || "unknown");
    const totals = data.totals && typeof data.totals === "object" ? data.totals : {};

    return NextResponse.json({
      order: {
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
      },
    });
  } catch (error) {
    console.error("GET /api/account/orders/[orderId] failed:", error);
    return NextResponse.json({ error: "Unable to load order details." }, { status: 500 });
  }
}
