import { NextResponse } from "next/server";
import { verifyBearerToken } from "@/lib/firebase-admin";
import { cancelOrderTransactionally } from "@/lib/checkout/cancel-order";

export async function POST(request: Request) {
  try {
    const { uid } = await verifyBearerToken(request);
    const body = (await request.json()) as { orderId?: string };
    const orderId = body?.orderId?.trim();

    if (!orderId) {
      return NextResponse.json({ error: "Missing order ID." }, { status: 400 });
    }

    const result = await cancelOrderTransactionally({ orderId, expectedUserId: uid });

    if (result.kind === "not_found") {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }
    if (result.kind === "forbidden") {
      return NextResponse.json({ error: "You are not authorized to cancel this order." }, { status: 403 });
    }
    if (result.kind === "not_cancellable") {
      return NextResponse.json(
        { error: `This order cannot be cancelled in its current state (${result.status || "unknown"}).` },
        { status: 409 },
      );
    }

    return NextResponse.json({ ok: true, orderId: result.orderId });
  } catch (error) {
    console.error("POST /api/checkout/cancel-order failed:", error);
    const message = error instanceof Error ? error.message : "Unable to cancel order.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
