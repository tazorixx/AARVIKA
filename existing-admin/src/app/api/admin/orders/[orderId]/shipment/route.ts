import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireAdmin, errorResponse } from "@/lib/catalog/http";
import { SHIPPING_ADMIN_ROLES, validateShipmentInput } from "@/lib/admin/shipping";
import { isValidFulfillmentTransition } from "@/lib/admin/orders";
import { enqueueNotification } from "@/lib/notifications/service";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ orderId: string }> }) {
  try {
    await requireAdmin(request, SHIPPING_ADMIN_ROLES);
    const { orderId } = await params;
    const body = (await request.json()) as Record<string, unknown>;
    const validation = validateShipmentInput(body);
    if (!validation.valid) return NextResponse.json({ error: validation.error }, { status: 400 });

    const db = getAdminDb();
    const ref = db.collection("orders").doc(orderId);
    const snap = await ref.get();
    if (!snap.exists) return NextResponse.json({ error: "Order not found." }, { status: 404 });

    const order = snap.data() || {};
    const currentStatus = String(order.status || "");
    if (!["packed", "shipped", "out_for_delivery", "delivery_failed"].includes(currentStatus)) {
      return NextResponse.json({ error: `Shipment cannot be updated while order is ${currentStatus}.` }, { status: 400 });
    }
    const shipmentToOrder: Record<string, string> = {
      picked_up: "shipped",
      in_transit: "shipped",
      out_for_delivery: "out_for_delivery",
      delivered: "delivered",
      exception: "delivery_failed",
    };
    const requestedOrderStatus = shipmentToOrder[validation.status];
    if (requestedOrderStatus && requestedOrderStatus !== currentStatus && !isValidFulfillmentTransition(currentStatus, requestedOrderStatus)) {
      return NextResponse.json({ error: `Invalid order transition from ${currentStatus} to ${requestedOrderStatus}.` }, { status: 400 });
    }

    const shipment = {
      provider: "manual",
      courier: validation.courier,
      trackingNumber: validation.trackingNumber,
      url: validation.trackingUrl || null,
      status: validation.status,
      updatedAt: FieldValue.serverTimestamp(),
    };

    const update: FirebaseFirestore.UpdateData<FirebaseFirestore.DocumentData> = {
      tracking: shipment,
      updatedAt: FieldValue.serverTimestamp(),
    };
    if (requestedOrderStatus && requestedOrderStatus !== currentStatus) {
      update.status = requestedOrderStatus;
      update.statusHistory = FieldValue.arrayUnion({ from: currentStatus, to: requestedOrderStatus, at: new Date().toISOString(), source: "shipment" });
    }

    await ref.update(update);

    const userId = typeof order.userId === "string" ? order.userId : "";
    if (userId && (validation.status === "picked_up" || validation.status === "in_transit" || validation.status === "out_for_delivery" || validation.status === "delivered")) {
      const type = validation.status === "delivered"
        ? "order_delivered"
        : validation.status === "out_for_delivery"
          ? "order_out_for_delivery"
          : "order_shipped";
      try {
        await enqueueNotification({
          db,
          type,
          userId,
          orderId,
          values: {
            orderId,
            customerName: typeof order.address?.name === "string" ? order.address.name : "Gift4U customer",
            courier: validation.courier,
            trackingNumber: validation.trackingNumber,
            trackingLink: validation.trackingUrl ? `\nTracking: ${validation.trackingUrl}` : "",
          },
        });
      } catch (notificationError) {
        console.warn("Non-fatal: failed to queue shipment notification:", notificationError);
      }
    }

    const updated = await ref.get();
    return NextResponse.json({ ok: true, order: { id: updated.id, ...updated.data() } });
  } catch (error) {
    console.error("POST /api/admin/orders/[orderId]/shipment failed:", error);
    return errorResponse(error);
  }
}
