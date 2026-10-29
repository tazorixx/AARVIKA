import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import type { Product } from "@/lib/catalog/types";
import { DEFAULT_MERCHANDISING, MERCHANDISING_KEYS, normalizeMerchandisingSetting, type MerchandisingKey } from "@/lib/admin/merchandising-modes";

export const runtime = "nodejs";

export async function GET() {
  const db = getAdminDb();
  const [settingsSnap, productsSnap] = await Promise.all([
    db.collection("merchandising_settings").get(),
    db.collection("products").where("status", "==", "live").limit(200).get(),
  ]);
  const settingsMap = new Map(settingsSnap.docs.map((d) => [d.id, d.data()]));
  const products = productsSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Product);
  const result: Record<string, { ids: string[]; active: boolean }> = {};

  for (const key of MERCHANDISING_KEYS) {
    const setting = normalizeMerchandisingSetting(key, settingsMap.get(key));
    if (!setting.active) { result[key] = { ids: [], active: false }; continue; }
    const flag = key === "bestsellers" ? "bestseller" : key === "newArrivals" ? "newArrival" : "featured";
    let selected: Product[];
    if (setting.mode === "manual") {
      const byId = new Map(products.map((p) => [p.id, p]));
      selected = setting.productIds.map((id) => byId.get(id)).filter((p): p is Product => Boolean(p));
    } else {
      selected = products.filter((p) => Boolean((p as unknown as Record<string, unknown>)[flag]));
      if (key === "bestsellers") selected.sort((a, b) => Number(b.reviewCount || 0) - Number(a.reviewCount || 0) || Number(b.rating || 0) - Number(a.rating || 0));
      if (key === "newArrivals") selected.sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
      if (key === "featured") selected.sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0) || Number(b.reviewCount || 0) - Number(a.reviewCount || 0));
    }
    result[key] = { ids: selected.slice(0, setting.limit).map((p) => p.id), active: true };
  }
  return NextResponse.json({ ...result }, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } });
}
