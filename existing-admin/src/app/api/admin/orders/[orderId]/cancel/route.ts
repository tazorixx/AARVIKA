import { NextResponse } from "next/server";
import { requireAdmin, errorResponse } from "@/lib/catalog/http";
import { ORDER_ADMIN_ROLES } from "@/lib/admin/orders";
import { cancelOrderTransactionally } from "@/lib/checkout/cancel-order";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ orderId: string }> }) {
  try {
    await requireAdmin(request, ORDER_ADMIN_ROLES);
    const { orderId } = await params;
    const result = await cancelOrderTransactionally({ orderId });

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
    console.error("POST /api/admin/orders/[orderId]/cancel failed:", error);
    return errorResponse(error);
  }
}
