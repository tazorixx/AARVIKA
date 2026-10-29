import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { processRazorpayPaymentEvent } from "@/lib/checkout/payment";
import { verifyRazorpayWebhookSignature } from "@/lib/checkout/razorpay";
import { enqueueNotification } from "@/lib/notifications/service";

export const runtime = "nodejs";

function getPaymentEntity(payload: Record<string, unknown>) {
  const payloadRoot = payload.payload as Record<string, unknown> | undefined;
  const paymentRoot = payloadRoot?.payment as Record<string, unknown> | undefined;
  const entity = paymentRoot?.entity as Record<string, unknown> | undefined;
  return entity || {};
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature") || "";
  const eventId = request.headers.get("x-razorpay-event-id") || "";

  if (!eventId) {
    return NextResponse.json({ error: "Missing Razorpay event ID." }, { status: 400 });
  }

  if (!verifyRazorpayWebhookSignature({ rawBody, signature })) {
    return NextResponse.json({ error: "Invalid Razorpay webhook signature." }, { status: 400 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid webhook JSON payload." }, { status: 400 });
  }

  const event = typeof payload.event === "string" ? payload.event : "";
  if (event !== "payment.captured" && event !== "payment.failed") {
    return NextResponse.json({ ok: true, ignored: true, event });
  }

  const payment = getPaymentEntity(payload);
  const paymentId = typeof payment.id === "string" ? payment.id : "";
  const razorpayOrderId = typeof payment.order_id === "string" ? payment.order_id : "";

  if (!paymentId || !razorpayOrderId) {
    return NextResponse.json({ error: "Webhook is missing payment/order identifiers." }, { status: 400 });
  }

  const db = getAdminDb();
  const orderQuery = await db
    .collection("orders")
    .where("razorpayOrderId", "==", razorpayOrderId)
    .limit(1)
    .get();

  if (orderQuery.empty) {
    return NextResponse.json({ error: "Gift4U order for this Razorpay order was not found." }, { status: 404 });
  }

  const orderRef = orderQuery.docs[0].ref;
  const result = await processRazorpayPaymentEvent({
    db,
    orderRef,
    eventId,
    paymentId,
    razorpayOrderId,
    outcome: event === "payment.captured" ? "captured" : "failed",
    failureCode: typeof payment.error_code === "string" ? payment.error_code : undefined,
    failureDescription: typeof payment.error_description === "string" ? payment.error_description : undefined,
  });

  if (result.kind === "processed" && result.status === "confirmed" && result.userId) {
    // Cart cleanup is deliberately non-authoritative and happens only after the
    // payment/inventory transaction has committed successfully.
    try {
      await db.collection("carts").doc(result.userId).delete();
    } catch (cartError) {
      console.warn("Non-fatal: failed to clear account cart after webhook confirmation:", cartError);
    }

    try {
      await enqueueNotification({
        db,
        type: "order_confirmed",
        userId: result.userId,
        orderId: orderQuery.docs[0].id,
        values: {
          orderId: orderQuery.docs[0].id,
          customerName: typeof orderQuery.docs[0].data()?.address?.name === "string" ? orderQuery.docs[0].data().address.name : "Gift4U customer",
        },
      });
    } catch (notificationError) {
      console.warn("Non-fatal: failed to queue order confirmation notification:", notificationError);
    }
  }

  if (result.kind === "processed" && result.status === "payment_failed" && result.userId) {
    try {
      await enqueueNotification({
        db,
        type: "payment_failed",
        userId: result.userId,
        orderId: orderQuery.docs[0].id,
        values: {
          orderId: orderQuery.docs[0].id,
          customerName: typeof orderQuery.docs[0].data()?.address?.name === "string" ? orderQuery.docs[0].data().address.name : "Gift4U customer",
        },
      });
    } catch (notificationError) {
      console.warn("Non-fatal: failed to queue payment failure notification:", notificationError);
    }
  }

  return NextResponse.json({ ok: true, ...result });
}
