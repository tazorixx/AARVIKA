export type DashboardOrder = {
  id?: unknown;
  status?: unknown;
  totals?: { grandTotal?: unknown };
  createdAt?: unknown;
  address?: { name?: unknown; phone?: unknown };
  items?: unknown;
};

export type DashboardInventory = {
  aarvika?: {purchaseMode?:unknown;bundle?:unknown};
  id: string;
  title?: unknown;
  thumbnail?: unknown;
  inventory?: { quantity?: unknown; reserved?: unknown; sold?: unknown };
};

const PAID_STATUSES = new Set(["confirmed", "processing", "shipped", "delivered"]);

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

function monthKey(value: Date, timeZone = "Asia/Kolkata") {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
  }).formatToParts(value);
  const year = parts.find((part) => part.type === "year")?.value || "";
  const month = parts.find((part) => part.type === "month")?.value || "";
  return `${year}-${month}`;
}

function monthLabel(key: string) {
  const [year, month] = key.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", { month: "short" }).format(new Date(year, month - 1, 1));
}

export function isSameCalendarDay(value: unknown, now = new Date(), timeZone = "Asia/Kolkata") {
  const date = toDate(value);
  if (!date) return false;
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(date) === formatter.format(now);
}

export function buildDashboardMetrics(
  orders: DashboardOrder[],
  inventory: DashboardInventory[],
  now = new Date(),
) {
  const todayOrders = orders.filter((order) => isSameCalendarDay(order.createdAt, now));
  const statusCounts: Record<string, number> = {};

  for (const order of orders) {
    const status = typeof order.status === "string" ? order.status : "unknown";
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  }

  const todayRevenue = todayOrders.reduce((sum, order) => {
    const status = typeof order.status === "string" ? order.status : "";
    return PAID_STATUSES.has(status) ? sum + numberValue(order.totals?.grandTotal) : sum;
  }, 0);

  const paidOrders = orders.filter((order) => typeof order.status === "string" && PAID_STATUSES.has(order.status));
  const monthlyMap = new Map<string, { key: string; label: string; orders: number; revenue: number }>();
  const currentMonthKey = monthKey(now);
  const monthCursor = new Date(now.getFullYear(), now.getMonth() - 11, 1);

  for (let index = 0; index < 12; index += 1) {
    const monthDate = new Date(monthCursor.getFullYear(), monthCursor.getMonth() + index, 1);
    const key = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, "0")}`;
    monthlyMap.set(key, { key, label: monthLabel(key), orders: 0, revenue: 0 });
  }

  for (const order of paidOrders) {
    const date = toDate(order.createdAt);
    if (!date) continue;
    const key = monthKey(date);
    const month = monthlyMap.get(key);
    if (!month) continue;
    month.orders += 1;
    month.revenue += numberValue(order.totals?.grandTotal);
  }

  const monthlySales = [...monthlyMap.values()];
  const currentMonth = monthlyMap.get(currentMonthKey) || { key: currentMonthKey, label: monthLabel(currentMonthKey), orders: 0, revenue: 0 };
  const previousMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const previousMonthKey = `${previousMonthDate.getFullYear()}-${String(previousMonthDate.getMonth() + 1).padStart(2, "0")}`;
  const previousMonth = monthlyMap.get(previousMonthKey) || { key: previousMonthKey, label: monthLabel(previousMonthKey), orders: 0, revenue: 0 };
  const monthChange = previousMonth.revenue > 0 ? ((currentMonth.revenue - previousMonth.revenue) / previousMonth.revenue) * 100 : 0;

  const recentOrders = [...orders]
    .sort((a, b) => (toDate(b.createdAt)?.getTime() || 0) - (toDate(a.createdAt)?.getTime() || 0))
    .slice(0, 6)
    .map((order) => ({
      id: typeof order.id === "string" ? order.id : "—",
      status: typeof order.status === "string" ? order.status : "unknown",
      total: numberValue(order.totals?.grandTotal),
      customerName: typeof order.address?.name === "string" ? order.address.name : "Customer",
      itemCount: Array.isArray(order.items) ? order.items.length : 0,
      createdAt: toDate(order.createdAt)?.toISOString() || null,
    }));

  const lowStock = inventory
    .filter(product=>product.aarvika?.purchaseMode!=="inquiry"&&!product.aarvika?.bundle)
    .map((product) => ({
      id: product.id,
      title: typeof product.title === "string" ? product.title : product.id,
      thumbnail: typeof product.thumbnail === "string" ? product.thumbnail : "",
      quantity: Math.max(0, numberValue(product.inventory?.quantity)),
      reserved: Math.max(0, numberValue(product.inventory?.reserved)),
    }))
    .filter((item) => item.quantity - item.reserved <= 5)
    .sort((a, b) => (a.quantity - a.reserved) - (b.quantity - b.reserved));

  return {
    todayOrders: todayOrders.length,
    todayRevenue,
    statusCounts,
    lowStock,
    recentOrders,
    monthlySales,
    currentMonthRevenue: currentMonth.revenue,
    previousMonthRevenue: previousMonth.revenue,
    monthChange,
  };
}
