export const ANALYTICS_ADMIN_ROLES = ["SUPER_ADMIN", "ADMIN", "ORDER_MANAGER"] as const;

export const PAID_ORDER_STATUSES = new Set(["confirmed", "processing", "shipped", "delivered"]);

export type AnalyticsOrderItem = {
  productId?: unknown;
  title?: unknown;
  qty?: unknown;
  unitPrice?: unknown;
  lineTotal?: unknown;
};

export type AnalyticsOrder = {
  id?: unknown;
  status?: unknown;
  createdAt?: unknown;
  totals?: { grandTotal?: unknown; discount?: unknown };
  payment?: { refundedAmount?: unknown };
  coupon?: unknown;
  items?: unknown;
};

export type AnalyticsProduct = {
  id: string;
  title?: unknown;
  categoryIds?: unknown;
  inventory?: { quantity?: unknown; reserved?: unknown; sold?: unknown };
};

export type AnalyticsCategory = { id: string; name?: unknown };
export type AnalyticsCoupon = { id: string; active?: unknown; usedCount?: unknown; usageLimit?: unknown };

function toDate(value: unknown): Date | null {
  if (value instanceof Date) return Number.isFinite(value.getTime()) ? value : null;
  if (typeof value === "string" || typeof value === "number") {
    const date = new Date(value);
    return Number.isFinite(date.getTime()) ? date : null;
  }
  if (value && typeof value === "object" && "toDate" in value) {
    const date = (value as { toDate?: () => Date }).toDate?.();
    return date instanceof Date && Number.isFinite(date.getTime()) ? date : null;
  }
  return null;
}

function numberValue(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function normalizeItems(value: unknown): AnalyticsOrderItem[] {
  return Array.isArray(value)
    ? value.filter((item): item is AnalyticsOrderItem => Boolean(item && typeof item === "object"))
    : [];
}

function dayKey(value: unknown, timeZone = "Asia/Kolkata") {
  const date = toDate(value);
  if (!date) return null;
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
  return `${parts.find((p) => p.type === "year")?.value}-${parts.find((p) => p.type === "month")?.value}-${parts.find((p) => p.type === "day")?.value}`;
}

export function isWithinDateRange(value: unknown, start: Date, endExclusive: Date) {
  const date = toDate(value);
  return Boolean(date && date >= start && date < endExclusive);
}

export function buildAnalyticsMetrics(
  orders: AnalyticsOrder[],
  products: AnalyticsProduct[],
  categories: AnalyticsCategory[],
  start: Date,
  endExclusive: Date,
  coupons: AnalyticsCoupon[] = [],
) {
  const rangeOrders = orders.filter((order) => isWithinDateRange(order.createdAt, start, endExclusive));
  const paidOrders = rangeOrders.filter((order) => typeof order.status === "string" && PAID_ORDER_STATUSES.has(order.status));
  const totalRevenue = paidOrders.reduce((sum, order) => sum + numberValue(order.totals?.grandTotal), 0);
  const averageOrderValue = paidOrders.length ? totalRevenue / paidOrders.length : 0;
  const refundedAmount = rangeOrders.reduce((sum, order) => sum + Math.max(0, numberValue(order.payment?.refundedAmount)), 0);

  const statusCounts: Record<string, number> = {};
  for (const order of rangeOrders) {
    const status = typeof order.status === "string" && order.status.trim() ? order.status.trim() : "unknown";
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  }

  const trendMap = new Map<string, { date: string; orders: number; paidOrders: number; revenue: number }>();
  for (let cursor = new Date(start); cursor < endExclusive; cursor.setDate(cursor.getDate() + 1)) {
    const key = dayKey(cursor);
    if (key) trendMap.set(key, { date: key, orders: 0, paidOrders: 0, revenue: 0 });
  }
  for (const order of rangeOrders) {
    const key = dayKey(order.createdAt);
    if (!key || !trendMap.has(key)) continue;
    const point = trendMap.get(key)!;
    point.orders += 1;
    if (typeof order.status === "string" && PAID_ORDER_STATUSES.has(order.status)) {
      point.paidOrders += 1;
      point.revenue += numberValue(order.totals?.grandTotal);
    }
  }

  const productMap = new Map(products.map((product) => [product.id, product]));
  const categoryMap = new Map(categories.map((category) => [category.id, typeof category.name === "string" ? category.name : category.id]));
  const productStats = new Map<string, { productId: string; title: string; units: number; revenue: number }>();
  const categoryStats = new Map<string, { categoryId: string; name: string; units: number; revenue: number }>();

  for (const order of paidOrders) {
    for (const item of normalizeItems(order.items)) {
      const productId = typeof item.productId === "string" ? item.productId : "";
      if (!productId) continue;
      const qty = Math.max(0, numberValue(item.qty));
      const revenue = Math.max(0, numberValue(item.lineTotal) || numberValue(item.unitPrice) * qty);
      const product = productMap.get(productId);
      const title = typeof item.title === "string" && item.title.trim() ? item.title.trim() : typeof product?.title === "string" && product.title.trim() ? product.title.trim() : productId;
      const existingProduct = productStats.get(productId) || { productId, title, units: 0, revenue: 0 };
      existingProduct.units += qty;
      existingProduct.revenue += revenue;
      productStats.set(productId, existingProduct);

      const categoryIds = Array.isArray(product?.categoryIds) ? product.categoryIds.filter((id): id is string => typeof id === "string") : [];
      for (const categoryId of categoryIds) {
        const existingCategory = categoryStats.get(categoryId) || { categoryId, name: categoryMap.get(categoryId) || categoryId, units: 0, revenue: 0 };
        existingCategory.units += qty;
        existingCategory.revenue += revenue;
        categoryStats.set(categoryId, existingCategory);
      }
    }
  }

  const inventory = products.reduce((summary, product) => {
    const available = Math.max(0, numberValue(product.inventory?.quantity) - numberValue(product.inventory?.reserved));
    summary.products += 1;
    summary.availableUnits += available;
    summary.reservedUnits += Math.max(0, numberValue(product.inventory?.reserved));
    summary.soldUnits += Math.max(0, numberValue(product.inventory?.sold));
    if (available === 0) summary.outOfStock += 1;
    else if (available <= 5) summary.lowStock += 1;
    return summary;
  }, { products: 0, availableUnits: 0, reservedUnits: 0, soldUnits: 0, lowStock: 0, outOfStock: 0 });

  const couponUsage = coupons.reduce((sum, coupon) => sum + Math.max(0, numberValue(coupon.usedCount)), 0);
  const activeCoupons = coupons.filter((coupon) => coupon.active !== false).length;
  const topProducts = [...productStats.values()].sort((a, b) => b.revenue - a.revenue || b.units - a.units || a.title.localeCompare(b.title)).slice(0, 10);
  const topCategories = [...categoryStats.values()].sort((a, b) => b.revenue - a.revenue || b.units - a.units || a.name.localeCompare(b.name)).slice(0, 10);

  return {
    totalOrders: rangeOrders.length,
    paidOrders: paidOrders.length,
    totalRevenue,
    averageOrderValue,
    refundedAmount,
    netRevenue: Math.max(0, totalRevenue - refundedAmount),
    statusCounts,
    dailyTrend: [...trendMap.values()],
    inventory,
    couponSummary: { total: coupons.length, active: activeCoupons, redemptions: couponUsage },
    topProducts,
    topCategories,
  };
}
