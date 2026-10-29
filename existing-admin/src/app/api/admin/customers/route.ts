import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { errorResponse, requireAdmin } from "@/lib/catalog/http";
import { buildCustomerSummary, matchesCustomerSearch } from "@/lib/admin/customers";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    await requireAdmin(request, ["SUPER_ADMIN", "ADMIN", "SUPPORT"]);
    const url = new URL(request.url);
    const q = url.searchParams.get("q") || "";
    const segment = url.searchParams.get("segment") || "all";
    const sort = url.searchParams.get("sort") || "recent";
    const requestedLimit = Number(url.searchParams.get("limit") || 100);
    const limit = Math.max(1, Math.min(200, Number.isFinite(requestedLimit) ? Math.floor(requestedLimit) : 100));
    const db = getAdminDb();
    const userSnap = await db.collection("users").limit(500).get();
    const orderSnap = await db.collection("orders").limit(1000).get();
    const ordersByUser = new Map<string, Array<Record<string, unknown>>>();
    for (const doc of orderSnap.docs) {
      const data = doc.data() as Record<string, unknown>;
      const uid = typeof data.userId === "string" ? data.userId : "";
      if (!uid) continue;
      const list = ordersByUser.get(uid) || [];
      list.push(data);
      ordersByUser.set(uid, list);
    }
    let customers = userSnap.docs
      .map((doc) => buildCustomerSummary(doc.id, doc.data(), ordersByUser.get(doc.id) || []))
      .filter((customer) => matchesCustomerSearch(customer, q));

    if (segment === "high_value") customers = customers.filter((customer) => customer.totalSpent >= 10000);
    if (segment === "active") customers = customers.filter((customer) => customer.paidOrderCount >= 1);
    if (segment === "new") customers = customers.filter((customer) => customer.orderCount === 0);

    customers.sort((a, b) => {
      if (sort === "spent") return b.totalSpent - a.totalSpent;
      if (sort === "orders") return b.orderCount - a.orderCount;
      return String(b.lastOrderAt || b.updatedAt || b.createdAt || "").localeCompare(String(a.lastOrderAt || a.updatedAt || a.createdAt || ""));
    });

    return NextResponse.json({ customers: customers.slice(0, limit) });
  } catch (error) {
    return errorResponse(error);
  }
}
