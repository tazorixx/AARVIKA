import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireAdmin, errorResponse } from "@/lib/catalog/http";
import { isValidFulfillmentTransition, ORDER_ADMIN_ROLES, normalizeStatus } from "@/lib/admin/orders";

export const runtime = "nodejs";

function serialize(value: unknown) {
  const date = (value as { toDate?: () => Date } | undefined)?.toDate?.();
  return date instanceof Date ? date.toISOString() : null;
}

function output(id: string, data: FirebaseFirestore.DocumentData) {
  return { id, ...data, createdAt: serialize(data.createdAt), updatedAt: serialize(data.updatedAt), expiresAt: serialize(data.expiresAt) };
}

export async function GET(request: Request, { params }: { params: Promise<{ orderId: string }> }) {
  try {
    await requireAdmin(request, ORDER_ADMIN_ROLES);
    const { orderId } = await params;
    const doc = await getAdminDb().collection("orders").doc(orderId).get();
    if (!doc.exists) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    return NextResponse.json(output(doc.id, doc.data()!));
  } catch (error) { return errorResponse(error); }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ orderId: string }> }) {
  try {
    await requireAdmin(request, ORDER_ADMIN_ROLES);
    const { orderId } = await params;
    const body = await request.json() as { status?: unknown; courier?: unknown; trackingNumber?: unknown; trackingUrl?: unknown; notes?: unknown };
    const db = getAdminDb();
    const ref = db.collection("orders").doc(orderId);
    const snap = await ref.get();
    if (!snap.exists) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    const current = String(snap.data()?.status || "");
    const next = normalizeStatus(body.status);
    if (next && !isValidFulfillmentTransition(current, next)) {
      return NextResponse.json({ error: `Invalid order transition from ${current} to ${next}.` }, { status: 400 });
    }

    const update: FirebaseFirestore.UpdateData<FirebaseFirestore.DocumentData> = { updatedAt: FieldValue.serverTimestamp() };
    if (next) {
      update.status = next;
      update.statusHistory = FieldValue.arrayUnion({ from: current, to: next, at: new Date().toISOString(), source: "admin" });
    }
    if (body.courier !== undefined) update["tracking.courier"] = typeof body.courier === "string" ? body.courier.trim().slice(0, 100) : "";
    if (body.trackingNumber !== undefined) update["tracking.trackingNumber"] = typeof body.trackingNumber === "string" ? body.trackingNumber.trim().slice(0, 150) : "";
    if (body.trackingUrl !== undefined) update["tracking.url"] = typeof body.trackingUrl === "string" ? body.trackingUrl.trim().slice(0, 500) : "";
    if (body.notes !== undefined) update["fulfillmentNotes"] = typeof body.notes === "string" ? body.notes.trim().slice(0, 2000) : "";
    await ref.update(update);
    return NextResponse.json({ success: true, order: output(orderId, (await ref.get()).data()!) });
  } catch (error) { return errorResponse(error); }
}
