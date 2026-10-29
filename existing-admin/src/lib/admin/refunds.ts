import type { AdminRole } from "@/lib/firebase-admin";

export const REFUND_ADMIN_ROLES: AdminRole[] = ["SUPER_ADMIN", "ADMIN"];

export const REFUNDABLE_ORDER_STATUSES = [
  "confirmed",
  "processing",
  "shipped",
  "delivered",
] as const;

export function canManageRefunds(role: unknown) {
  return typeof role === "string" && REFUND_ADMIN_ROLES.includes(role as AdminRole);
}

export function getRefundableAmount(order: Record<string, unknown>) {
  const total = Math.max(0, Number((order.totals as Record<string, unknown> | undefined)?.grandTotal ?? 0));
  const refunded = Math.max(0, Number((order.payment as Record<string, unknown> | undefined)?.refundedAmount ?? 0));
  return Math.max(0, Number((total - refunded).toFixed(2)));
}

export function validateRefundRequest(
  order: Record<string, unknown>,
  amount: unknown,
) {
  const status = typeof order.status === "string" ? order.status : "";
  if (!(REFUNDABLE_ORDER_STATUSES as readonly string[]).includes(status)) {
    return { valid: false as const, error: `Order status "${status}" is not refundable.` };
  }

  const requested = Number(amount);
  if (!Number.isFinite(requested) || requested <= 0) {
    return { valid: false as const, error: "Refund amount must be greater than zero." };
  }

  const refundable = getRefundableAmount(order);
  if (requested > refundable + 0.001) {
    return { valid: false as const, error: `Maximum refundable amount is ₹${refundable.toFixed(2)}.` };
  }

  return { valid: true as const, amount: Number(requested.toFixed(2)), refundable };
}

export function getRefundStatus(order: Record<string, unknown>) {
  const payment = (order.payment || {}) as Record<string, unknown>;
  const refunded = Math.max(0, Number(payment.refundedAmount ?? 0));
  const total = Math.max(0, Number((order.totals as Record<string, unknown> | undefined)?.grandTotal ?? 0));
  if (refunded <= 0) return "none" as const;
  if (refunded + 0.001 >= total) return "full" as const;
  return "partial" as const;
}
