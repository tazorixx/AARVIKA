import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/catalog/http";
import { getAdminDb } from "@/lib/catalog/server";
export const runtime = "nodejs";
function csvCell(value: unknown) { const text = value == null ? "" : String(value); return `"${text.replace(/"/g, '""')}"`; }
export async function GET(request: Request) {
  try {
    await requireAdmin(request, ["SUPER_ADMIN", "ADMIN", "CATALOG_MANAGER"]);
    const status = new URL(request.url).searchParams.get("status");
    const snap = await getAdminDb().collection("products").orderBy("updatedAt", "desc").limit(500).get();
    const rows = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Record<string, unknown>).filter((product) => !status || status === "all" || product.status === status);
    const lines = [["id","sku","title","slug","status","price","mrp","featured","bestseller","newArrival","availableStock"].map(csvCell).join(",")];
    for (const product of rows) { const inventory = (product.inventory ?? {}) as Record<string, unknown>; lines.push([product.id,product.sku,product.title,product.slug,product.status,product.price,product.mrp,product.featured,product.bestseller,product.newArrival,inventory.quantity].map(csvCell).join(",")); }
    return new NextResponse(`\uFEFF${lines.join("\r\n")}`, { headers: { "Content-Type":"text/csv; charset=utf-8", "Content-Disposition":`attachment; filename="gift4u-products-${new Date().toISOString().slice(0,10)}.csv"`, "Cache-Control":"no-store" } });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to export products." }, { status: 500 }); }
}
