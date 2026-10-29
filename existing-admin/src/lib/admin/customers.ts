export type CustomerProfile = {
  uid: string;
  name: string;
  email: string;
  phone: string;
  createdAt?: string | null;
  updatedAt?: string | null;
  orderCount: number;
  paidOrderCount: number;
  totalSpent: number;
  lastOrderAt?: string | null;
};

export const PAID_ORDER_STATUSES = new Set(["confirmed", "processing", "shipped", "delivered"]);

export function buildCustomerSummary(
  uid: string,
  profile: Record<string, unknown>,
  orders: Array<Record<string, unknown>>,
): CustomerProfile {
  const paidOrders = orders.filter((order) => typeof order.status === "string" && PAID_ORDER_STATUSES.has(order.status));
  const timestamps = orders
    .map((order) => toIso(order.createdAt))
    .filter((value): value is string => Boolean(value))
    .sort();

  return {
    uid,
    name: typeof profile.name === "string" ? profile.name : "",
    email: typeof profile.email === "string" ? profile.email : "",
    phone: typeof profile.phone === "string" ? profile.phone : "",
    createdAt: toIso(profile.createdAt),
    updatedAt: toIso(profile.updatedAt),
    orderCount: orders.length,
    paidOrderCount: paidOrders.length,
    totalSpent: paidOrders.reduce((sum, order) => sum + Number((order.totals as { grandTotal?: unknown } | undefined)?.grandTotal || 0), 0),
    lastOrderAt: timestamps.at(-1) || null,
  };
}

export function matchesCustomerSearch(customer: CustomerProfile, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [customer.uid, customer.name, customer.email, customer.phone].join(" ").toLowerCase().includes(q);
}

export function toIso(value: unknown): string | null {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object" && value !== null && "toDate" in value && typeof (value as { toDate?: unknown }).toDate === "function") {
    const date = (value as { toDate: () => Date }).toDate();
    return date instanceof Date && Number.isFinite(date.getTime()) ? date.toISOString() : null;
  }
  const date = new Date(String(value));
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}
