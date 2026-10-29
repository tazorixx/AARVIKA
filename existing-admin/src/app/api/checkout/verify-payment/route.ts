import { NextResponse } from "next/server";
import { getAdminDb, verifyBearerToken } from "@/lib/firebase-admin";
import { verifyRazorpayPaymentSignature } from "@/lib/checkout/razorpay";
import { processRazorpayPaymentEvent } from "@/lib/checkout/payment";

export async function POST(request: Request) {
  try {
    if (process.env.NODE_ENV !== "development") {
      return NextResponse.json(
        { error: "Browser payment verification is disabled. Payment confirmation is handled by the Razorpay webhook." },
        { status: 410 },
      );
    }

    const { uid } = await verifyBearerToken(request);
    const body = (await request.json()) as {
      orderId?: string;
      razorpay_order_id?: string;
      razorpay_payment_id?: string;
      razorpay_signature?: string;
    };

    const orderId = body.orderId?.trim();
    const razorpayOrderId = body.razorpay_order_id?.trim();
    const razorpayPaymentId = body.razorpay_payment_id?.trim();
    const razorpaySignature = body.razorpay_signature?.trim();

    if (!orderId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return NextResponse.json({ error: "Incomplete payment verification payload." }, { status: 400 });
    }

    if (!verifyRazorpayPaymentSignature({
      razorpayOrderId,
      razorpayPaymentId,
      signature: razorpaySignature,
    })) {
      return NextResponse.json({ error: "Payment verification failed: invalid signature." }, { status: 400 });
    }

    const db = getAdminDb();
    const orderRef = db.collection("orders").doc(orderId);
    const orderSnap = await orderRef.get();

    if (!orderSnap.exists || orderSnap.data()?.userId !== uid) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    // Development-only mock/test path. Production payment authority remains the webhook.
    const result = await processRazorpayPaymentEvent({
      db,
      orderRef,
      eventId: `dev-${razorpayPaymentId}`,
      paymentId: razorpayPaymentId,
      razorpayOrderId,
      outcome: "captured",
    });

    if (result.kind === "processed" && result.status === "confirmed" && result.userId) {
      try {
        await db.collection("carts").doc(result.userId).delete();
      } catch (cartError) {
        console.warn("Non-fatal: failed to clear account cart after dev payment:", cartError);
      }
    }

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("POST /api/checkout/verify-payment failed:", error);
    const message = error instanceof Error ? error.message : "Unable to verify payment.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
