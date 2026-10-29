import { NextResponse } from "next/server";
import { errorResponse, requireCatalogAdmin } from "@/lib/catalog/http";
import { getAdminDb } from "@/lib/firebase-admin";
import { getRelatedProductConfig, getRelatedProducts } from "@/lib/catalog/related";
import type { Product } from "@/lib/catalog/types";
import { FieldValue } from "firebase-admin/firestore";

export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const caller = await requireCatalogAdmin(request);
    const id = (await params).id;
    const db = getAdminDb();
    const snap = await db.collection("products").doc(id).get();
    if (!snap.exists) return NextResponse.json({ error: "Not found." }, { status: 404 });

    const product = { id: snap.id, ...snap.data() } as Product;
    const config = await getRelatedProductConfig(id);
    const live = await db.collection("products").where("status", "==", "live").limit(250).get();
    const candidates = live.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }) as Product)
      .filter((item) => item.id !== id && !item.personalization?.imageUpload)
      .slice(0, 200);

    const preview = await getRelatedProducts(product, 8);
    return NextResponse.json({
      config,
      candidates,
      preview,
      actorRole: caller.role,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const caller = await requireCatalogAdmin(request);
    const id = (await params).id;
    const body = (await request.json()) as { mode?: unknown; productIds?: unknown };
    const mode = body.mode === "manual" ? "manual" : "auto";
    const rawProductIds = Array.isArray(body.productIds)
      ? body.productIds.filter((value): value is string => typeof value === "string")
      : [];
    const productIds = [...new Set(rawProductIds.map((value) => value.trim()).filter((value) => value.length > 0 && value !== id))].slice(0, 12);

    const db = getAdminDb();
    const productRef = db.collection("products").doc(id);
    const productSnap = await productRef.get();
    if (!productSnap.exists) return NextResponse.json({ error: "Not found." }, { status: 404 });

    if (mode === "manual" && productIds.length) {
      const candidateSnaps = await Promise.all(productIds.map((productId) => db.collection("products").doc(productId).get()));
      const invalid = candidateSnaps.some((snap) => !snap.exists || snap.data()?.status !== "live");
      if (invalid) return NextResponse.json({ error: "Manual related products must all be live products." }, { status: 400 });
    }

    await productRef.update({
      relatedProductsMode: mode,
      relatedProductIds: productIds,
      updatedAt: FieldValue.serverTimestamp(),
    });

    await db.collection("admin_audit_logs").add({
      actorUid: caller.uid,
      actorRole: caller.role,
      action: "PRODUCT_RELATED_PRODUCTS_UPDATED",
      entityType: "product",
      entityId: id,
      summary: `Updated related products (${mode})`,
      metadata: { mode, count: productIds.length },
      createdAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ ok: true, mode, productIds });
  } catch (error) {
    return errorResponse(error);
  }
}
