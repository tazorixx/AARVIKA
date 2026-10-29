import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireAdmin, errorResponse } from "@/lib/catalog/http";
import { REFUND_ADMIN_ROLES, validateRefundRequest } from "@/lib/admin/refunds";
import { createRazorpayRefund } from "@/lib/checkout/razorpay";

export const runtime = "nodejs";

function serialize(value: unknown) {
  const date = (value as { toDate?: () => Date } | undefined)?.toDate?.();
  return date instanceof Date ? date.toISOString() : value ?? null;
}

export async function GET(request: Request, { params }: { params: Promise<{ orderId: string }> }) {
  try {
    await requireAdmin(request, REFUND_ADMIN_ROLES);
    const { orderId } = await params;
    const db = getAdminDb();
    const orderRef = db.collection("orders").doc(orderId);
    const orderSnap = await orderRef.get();
    if (!orderSnap.exists) return NextResponse.json({ error: "Order not found." }, { status: 404 });

    const snap = await orderRef.collection("refunds").orderBy("createdAt", "desc").limit(50).get();
    const refunds = snap.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: serialize(data.createdAt),
        updatedAt: serialize(data.updatedAt),
      };
    });
    return NextResponse.json({ refunds });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ orderId: string }> }) {
  try {
    await requireAdmin(request, REFUND_ADMIN_ROLES);
    const { orderId } = await params;
    const body = (await request.json()) as { amount?: unknown; reason?: unknown };
    const db = getAdminDb();
    const ref = db.collection("orders").doc(orderId);
    const snap = await ref.get();
    if (!snap.exists) return NextResponse.json({ error: "Order not found." }, { status: 404 });

    const order = snap.data() || {};
    const validation = validateRefundRequest(order, body.amount);
    if (!validation.valid) return NextResponse.json({ error: validation.error }, { status: 400 });

    const payment = (order.payment || {}) as Record<string, unknown>;
    const paymentId = typeof payment.paymentId === "string" ? payment.paymentId : "";
    if (!paymentId) return NextResponse.json({ error: "No captured Razorpay payment is attached to this order." }, { status: 400 });

    const reason = typeof body.reason === "string" ? body.reason.trim().slice(0, 500) : "Admin refund";
    const idempotencyKey = `g4u-refund-${orderId}-${validation.amount.toFixed(2)}`;
    const intentRef = ref.collection("refunds").doc(idempotencyKey);
    const existingIntent = await intentRef.get();
    if (existingIntent.exists) {
      const existing = existingIntent.data() || {};
      if (existing.status === "processed") {
        return NextResponse.json({ ok: true, refund: existing.refund, refundedAmount: Number(existing.refundedAmount || 0), duplicate: true });
      }
      return NextResponse.json({ error: "A refund for this amount is already being processed. Please check the order again before retrying." }, { status: 409 });
    }
    await intentRef.create({ status: "processing", amount: validation.amount, reason, createdAt: FieldValue.serverTimestamp() });

    let refund: Awaited<ReturnType<typeof createRazorpayRefund>>;
    try {
      refund = await createRazorpayRefund({
        paymentId,
        amountInPaise: Math.round(validation.amount * 100),
        notes: { orderId, reason },
        idempotencyKey,
      });
    } catch (refundError) {
      await intentRef.set({ status: "failed", error: refundError instanceof Error ? refundError.message : "Refund failed", updatedAt: FieldValue.serverTimestamp() }, { merge: true });
      throw refundError;
    }

    const nextRefunded = Number((Math.max(0, Number(payment.refundedAmount || 0)) + validation.amount).toFixed(2));
    const grandTotal = Number((order.totals as Record<string, unknown> | undefined)?.grandTotal || 0);
    const nextOrderStatus = nextRefunded + 0.001 >= grandTotal ? "refunded" : String(order.status || "");
    await ref.update({
      ...(nextOrderStatus !== String(order.status || "") ? {
        status: nextOrderStatus,
        statusHistory: FieldValue.arrayUnion({ from: String(order.status || ""), to: nextOrderStatus, at: new Date().toISOString(), source: "refund" }),
      } : {}),
      payment: {
        ...payment,
        refundedAmount: nextRefunded,
        refundStatus: nextRefunded + 0.001 >= grandTotal ? "full" : "partial",
        lastRefundId: refund.id,
        lastRefundAmount: validation.amount,
        lastRefundReason: reason,
        lastRefundAt: FieldValue.serverTimestamp(),
      },
      updatedAt: FieldValue.serverTimestamp(),
    });
    await intentRef.set({ status: "processed", refund, refundedAmount: nextRefunded, updatedAt: FieldValue.serverTimestamp() }, { merge: true });

    return NextResponse.json({ ok: true, refund, refundedAmount: nextRefunded });
  } catch (error) {
    console.error("POST /api/admin/orders/[orderId]/refund failed:", error);
    return errorResponse(error);
  }
}
