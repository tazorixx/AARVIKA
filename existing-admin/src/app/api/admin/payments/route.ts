import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase-admin";
import { errorResponse, requireAdmin } from "@/lib/catalog/http";
import { fetchRazorpayPayment } from "@/lib/checkout/razorpay";
import { processRazorpayPaymentEvent } from "@/lib/checkout/payment";
import { recordAdminAudit } from "@/lib/admin/audit";

export const runtime = "nodejs";
const PAYMENT_ROLES = ["SUPER_ADMIN", "ADMIN", "ORDER_MANAGER"] as const;
const REFUND_ROLES = new Set(["SUPER_ADMIN", "ADMIN"]);

function serialize(value: unknown) {
  const date = (value as { toDate?: () => Date } | undefined)?.toDate?.();
  return date instanceof Date ? date.toISOString() : value ?? null;
}

function paymentStatus(order: FirebaseFirestore.DocumentData) {
  const payment = (order.payment || {}) as Record<string, unknown>;
  const orderStatus = String(order.status || "");
  if (payment.refundStatus === "full") return "refunded";
  if (payment.refundStatus === "partial") return "partially_refunded";
  if (payment.status === "captured" || orderStatus === "confirmed") return "success";
  if (payment.status === "failed" || orderStatus === "payment_failed") return "failed";
  if (orderStatus === "pending_payment") return "pending";
  if (payment.status === "setup_failed" || orderStatus === "payment_setup_failed") return "failed";
  return String(payment.status || orderStatus || "unknown");
}

function output(doc: FirebaseFirestore.QueryDocumentSnapshot<FirebaseFirestore.DocumentData>) {
  const data = doc.data();
  const payment = (data.payment || {}) as Record<string, unknown>;
  return {
    id: doc.id,
    orderId: doc.id,
    userId: data.userId || null,
    customerName: data.address?.name || null,
    customerPhone: data.address?.phone || null,
    amount: Number(data.totals?.grandTotal || 0),
    currency: String(data.totals?.currency || payment.currency || "INR"),
    orderStatus: data.status || null,
    status: paymentStatus(data),
    providerStatus: payment.status || null,
    paymentId: payment.paymentId || null,
    razorpayOrderId: data.razorpayOrderId || payment.orderId || null,
    method: payment.method || null,
    failureCode: payment.failureCode || null,
    failureDescription: payment.failureDescription || null,
    refundedAmount: Number(payment.refundedAmount || 0),
    refundStatus: payment.refundStatus || "none",
    lastRefundId: payment.lastRefundId || null,
    lastRefundAt: serialize(payment.lastRefundAt),
    createdAt: serialize(data.createdAt),
    updatedAt: serialize(data.updatedAt),
  };
}

export async function GET(request: Request) {
  try {
    await requireAdmin(request, [...PAYMENT_ROLES]);
    const url = new URL(request.url);
    const status = url.searchParams.get("status")?.trim().toLowerCase() || "all";
    const q = url.searchParams.get("q")?.trim().toLowerCase() || "";
    const requestedLimit = Number(url.searchParams.get("limit") || 50);
    const limit = Math.max(1, Math.min(100, Number.isFinite(requestedLimit) ? Math.floor(requestedLimit) : 50));
    const cursor = url.searchParams.get("cursor");
    const db = getAdminDb();

    let query: FirebaseFirestore.Query = db.collection("orders").orderBy("createdAt", "desc").limit(limit);
    if (cursor) {
      const cursorDoc = await db.collection("orders").doc(cursor).get();
      if (cursorDoc.exists) query = query.startAfter(cursorDoc);
    }
    const snap = await query.get();
    let payments = snap.docs.map(output);
    if (status !== "all") payments = payments.filter((item) => item.status === status);
    if (q) {
      payments = payments.filter((item) => [item.orderId, item.userId, item.customerName, item.customerPhone, item.paymentId, item.razorpayOrderId].filter(Boolean).join(" ").toLowerCase().includes(q));
    }

    const all = await db.collection("orders").orderBy("createdAt", "desc").limit(500).get();
    const summary = all.docs.reduce((acc, doc) => {
      const item = output(doc);
      acc.total += 1;
      acc.amount += item.status === "success" ? item.amount : 0;
      if (item.status === "success") acc.success += 1;
      if (item.status === "pending") acc.pending += 1;
      if (item.status === "failed") acc.failed += 1;
      if (item.status === "refunded" || item.status === "partially_refunded") acc.refunds += 1;
      return acc;
    }, { total: 0, success: 0, pending: 0, failed: 0, refunds: 0, amount: 0 });

    return NextResponse.json({ payments, nextCursor: snap.docs.length === limit ? snap.docs.at(-1)?.id || null : null, summary });
  } catch (error) { return errorResponse(error); }
}

export async function POST(request: Request) {
  try {
    const caller = await requireAdmin(request, [...PAYMENT_ROLES]);
    const body = await request.json() as { orderId?: unknown };
    const orderId = typeof body.orderId === "string" ? body.orderId.trim() : "";
    if (!orderId) return NextResponse.json({ error: "Order ID is required." }, { status: 400 });

    const db = getAdminDb();
    const ref = db.collection("orders").doc(orderId);
    const snap = await ref.get();
    if (!snap.exists) return NextResponse.json({ error: "Order not found." }, { status: 404 });
    const order = snap.data() || {};
    const payment = (order.payment || {}) as Record<string, unknown>;
    const paymentId = typeof payment.paymentId === "string" ? payment.paymentId : "";
    const razorpayOrderId = typeof order.razorpayOrderId === "string" ? order.razorpayOrderId : "";
    if (!paymentId || !razorpayOrderId) return NextResponse.json({ error: "This order does not have enough Razorpay identifiers to reconcile." }, { status: 400 });

    const provider = await fetchRazorpayPayment(paymentId);
    if (provider.orderId && provider.orderId !== razorpayOrderId) return NextResponse.json({ error: "Razorpay payment belongs to a different Razorpay order." }, { status: 409 });

    let result: unknown = null;
    if (provider.status === "captured" || provider.captured === true) {
      result = await processRazorpayPaymentEvent({
        db,
        orderRef: ref,
        eventId: `admin-reconcile-${paymentId}-${Date.now()}`,
        paymentId,
        razorpayOrderId,
        outcome: "captured",
      });
    } else if (provider.status === "failed") {
      result = await processRazorpayPaymentEvent({
        db,
        orderRef: ref,
        eventId: `admin-reconcile-${paymentId}-${Date.now()}`,
        paymentId,
        razorpayOrderId,
        outcome: "failed",
        failureCode: provider.errorCode,
        failureDescription: provider.errorDescription,
      });
    } else {
      await ref.update({ "payment.providerStatus": provider.status, "payment.providerCheckedAt": FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
    }

    await recordAdminAudit(db, {
      actorUid: caller.uid,
      actorRole: caller.role!,
      action: "PAYMENT_RECONCILED",
      entityType: "payment",
      entityId: orderId,
      summary: `Reconciled payment ${paymentId} from Razorpay (${provider.status})`,
      metadata: { paymentId, razorpayOrderId, providerStatus: provider.status },
    });

    return NextResponse.json({ ok: true, provider, result });
  } catch (error) { return errorResponse(error); }
}
