import type { AdminRole } from "@/lib/firebase-admin";

export const ORDER_ADMIN_ROLES: AdminRole[] = ["SUPER_ADMIN", "ADMIN", "ORDER_MANAGER"];

export const ORDER_STATUSES = [
  "pending_payment", "payment_setup_failed", "payment_failed",
  "confirmed", "processing", "packed", "shipped", "out_for_delivery",
  "delivered", "delivery_failed", "returned", "cancelled", "expired", "refunded",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const FULFILLMENT_STATUSES = ["confirmed", "processing", "packed", "shipped", "out_for_delivery", "delivered"] as const;
export type FulfillmentStatus = (typeof FULFILLMENT_STATUSES)[number];

const transitions: Record<string, string[]> = {
  pending_payment: ["confirmed", "payment_failed", "expired", "cancelled"],
  payment_setup_failed: [],
  payment_failed: [],
  confirmed: ["processing", "cancelled", "refunded"],
  processing: ["packed", "cancelled", "refunded"],
  packed: ["shipped", "cancelled", "refunded"],
  shipped: ["out_for_delivery", "delivery_failed", "returned", "refunded"],
  out_for_delivery: ["delivered", "delivery_failed", "returned"],
  delivered: ["returned", "refunded"],
  delivery_failed: ["out_for_delivery", "returned", "refunded"],
  returned: ["refunded"],
  cancelled: ["refunded"],
  expired: [],
  refunded: [],
};

export function canManageOrders(role: unknown) {
  return typeof role === "string" && ORDER_ADMIN_ROLES.includes(role as AdminRole);
}

export function normalizeStatus(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function isValidOrderStatus(value: unknown): value is OrderStatus {
  return ORDER_STATUSES.includes(normalizeStatus(value) as OrderStatus);
}

export function isValidFulfillmentTransition(from: string, to: string) {
  return transitions[normalizeStatus(from)]?.includes(normalizeStatus(to)) ?? false;
}

export function getAllowedOrderTransitions(from: string) {
  return [...(transitions[normalizeStatus(from)] || [])];
}

export function isTerminalOrderStatus(status: string) {
  return ["payment_setup_failed", "payment_failed", "expired", "cancelled", "refunded"].includes(normalizeStatus(status));
}
