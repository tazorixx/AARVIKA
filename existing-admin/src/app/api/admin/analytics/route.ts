import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { errorResponse, requireAdmin } from "@/lib/catalog/http";
import { buildAnalyticsMetrics } from "@/lib/admin/analytics";

export const runtime = "nodejs";

function parseDate(value: string | null, fallback: Date) {
  if (!value) return fallback;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00+05:30`);
  return Number.isFinite(date.getTime()) ? date : null;
}

function serialize(value: unknown) {
  const date = (value as { toDate?: () => Date } | undefined)?.toDate?.();
  return date instanceof Date ? date.toISOString() : value instanceof Date ? value.toISOString() : null;
}

export async function GET(request: Request) {
  try {
    await requireAdmin(request, ["SUPER_ADMIN", "ADMIN", "ORDER_MANAGER"]);
    const params = new URL(request.url).searchParams;
    const now = new Date();
    const indiaToday = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
    const todayStart = new Date(`${indiaToday}T00:00:00+05:30`);
    const defaultStart = new Date(todayStart);
    defaultStart.setDate(defaultStart.getDate() - 29);
    const defaultEnd = new Date(todayStart);
    const start = parseDate(params.get("start"), defaultStart);
    const endDate = parseDate(params.get("end"), defaultEnd);
    if (!start || !endDate) return NextResponse.json({ error: "Dates must use YYYY-MM-DD format." }, { status: 400 });
    const endExclusive = new Date(endDate.getTime() + 24 * 60 * 60 * 1000);
    if (start >= endExclusive) return NextResponse.json({ error: "Start date must be on or before end date." }, { status: 400 });
    if (endExclusive.getTime() - start.getTime() > 366 * 24 * 60 * 60 * 1000) return NextResponse.json({ error: "Analytics date range cannot exceed 366 days." }, { status: 400 });

    const db = getAdminDb();
    const [ordersSnap, productsSnap, categoriesSnap, couponsSnap] = await Promise.all([
      db.collection("orders").orderBy("createdAt", "desc").limit(5000).get(),
      db.collection("products").limit(1000).get(),
      db.collection("categories").limit(500).get(),
      db.collection("coupons").limit(1000).get(),
    ]);

    const orders = ordersSnap.docs.map((doc) => {
      const data = doc.data();
      return { id: doc.id, status: data.status, createdAt: serialize(data.createdAt), totals: data.totals, payment: data.payment, coupon: data.coupon, items: data.items };
    });
    const products = productsSnap.docs.map((doc) => ({ id: doc.id, title: doc.data().title, categoryIds: doc.data().categoryIds, inventory: doc.data().inventory }));
    const categories = categoriesSnap.docs.map((doc) => ({ id: doc.id, name: doc.data().name }));
    const coupons = couponsSnap.docs.map((doc) => ({ id: doc.id, active: doc.data().active, usedCount: doc.data().usedCount, usageLimit: doc.data().usageLimit }));

    return NextResponse.json({
      start: params.get("start") || defaultStart.toISOString().slice(0, 10),
      end: params.get("end") || endDate.toISOString().slice(0, 10),
      ...buildAnalyticsMetrics(orders, products, categories, start, endExclusive, coupons),
    });
  } catch (error) {
    return errorResponse(error);
  }
}
