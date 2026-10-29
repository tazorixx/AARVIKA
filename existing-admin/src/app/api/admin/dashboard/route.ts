import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { errorResponse, requireAdmin } from "@/lib/catalog/http";
import { buildDashboardMetrics } from "@/lib/admin/dashboard";

export const runtime = "nodejs";

function serialize(value: unknown) {
  const date = (value as { toDate?: () => Date } | undefined)?.toDate?.();
  return date instanceof Date ? date.toISOString() : null;
}

export async function GET(request: Request) {
  try {
    await requireAdmin(request, ["SUPER_ADMIN", "ADMIN", "CATALOG_MANAGER", "ORDER_MANAGER", "SUPPORT"]);
    const db = getAdminDb();
    const ordersQuery = db.collection("orders").orderBy("createdAt", "desc").limit(500);
    const [ordersSnap, productsSnap] = await Promise.all([
      ordersQuery.get(),
      db.collection("products").limit(500).get(),
    ]);

    const orders = ordersSnap.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        status: data.status,
        totals: data.totals,
        createdAt: serialize(data.createdAt),
        address: data.address,
        items: data.items,
      };
    });

    const inventory = productsSnap.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        thumbnail: data.thumbnail,
        inventory: data.inventory,
        aarvika:data.aarvika?{purchaseMode:data.aarvika.purchaseMode,bundle:!!data.aarvika.bundle}:undefined,
      };
    });

    return NextResponse.json(buildDashboardMetrics(orders, inventory));
  } catch (error) {
    return errorResponse(error);
  }
}
