import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { getClientKey, checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { isServiceable } from "@/lib/checkout/validation";
import { applyDeliveryZone, findDeliveryZone } from "@/lib/checkout/delivery-zones";
import type { Product } from "@/lib/catalog/types";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const rate = checkRateLimit(`delivery-availability:${getClientKey(request)}`, 30, 60_000);
  if (!rate.allowed) return rateLimitResponse(rate.resetAt);

  try {
    const url = new URL(request.url);
    const productId = url.searchParams.get("productId")?.trim() || "";
    const pincode = url.searchParams.get("pincode")?.trim() || "";
    if (!productId || !/^\d{6}$/.test(pincode)) {
      return NextResponse.json({ error: "Product and valid 6-digit pincode are required." }, { status: 400 });
    }

    const db = getAdminDb();
    const snapshot = await db.collection("products").doc(productId).get();
    if (!snapshot.exists) return NextResponse.json({ error: "Product not found." }, { status: 404 });
    const product = snapshot.data() as Product;
    if (product.status !== "live") return NextResponse.json({ error: "This gift is not currently available." }, { status: 404 });
    if (!isServiceable(product, pincode)) return NextResponse.json({ error: "This gift is not currently serviceable to this pincode." }, { status: 400 });

    const zone = await findDeliveryZone(db, pincode);
    const delivery = applyDeliveryZone(product, zone);
    return NextResponse.json({
      serviceable: true,
      delivery,
      zone: zone ? { id: zone.id, name: zone.name } : null,
      holidays: zone?.delivery.holidays || [],
    }, { headers: { "Cache-Control": "private, max-age=30" } });
  } catch (error) {
    console.error("GET /api/delivery/availability failed", error);
    return NextResponse.json({ error: "Unable to check delivery availability right now." }, { status: 500 });
  }
}
