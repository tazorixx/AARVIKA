/**
 * Customer-facing order lifecycle and cancellation policy.
 *
 * Customer cancellation is intentionally limited to pending_payment because
 * that state still owns the checkout reservations. Paid/fulfillment orders
 * require the separate operations/refund workflow.
 */
export const CUSTOMER_CANCELLABLE_ORDER_STATUSES = ["pending_payment"] as const;
export type CustomerCancellableOrderStatus =
  (typeof CUSTOMER_CANCELLABLE_ORDER_STATUSES)[number];

export const CUSTOMER_ORDER_STATUSES = [
  "pending_payment",
  "payment_setup_failed",
  "payment_failed",
  "confirmed",
  "processing",
  "packed",
  "shipped",
  "out_for_delivery",
  "delivered",
  "delivery_failed",
  "returned",
  "expired",
  "cancelled",
  "refunded",
] as const;
export type CustomerOrderStatus = (typeof CUSTOMER_ORDER_STATUSES)[number];

export const CUSTOMER_TIMELINE_STEPS = [
  { key: "placed", label: "Order Placed" },
  { key: "confirmed", label: "Confirmed" },
  { key: "processing", label: "Preparing Gift" },
  { key: "packed", label: "Packed" },
  { key: "shipped", label: "Shipped" },
  { key: "out_for_delivery", label: "Out for Delivery" },
  { key: "delivered", label: "Delivered" },
] as const;

const STATUS_LABELS: Record<CustomerOrderStatus, string> = {
  pending_payment: "Awaiting Payment",
  payment_setup_failed: "Payment Setup Failed",
  payment_failed: "Payment Failed",
  confirmed: "Confirmed",
  processing: "Preparing",
  packed: "Packed",
  shipped: "Shipped",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  delivery_failed: "Delivery Failed",
  returned: "Returned",
  expired: "Expired",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

export function normalizeCustomerOrderStatus(value: unknown): CustomerOrderStatus | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  return (CUSTOMER_ORDER_STATUSES as readonly string[]).includes(normalized)
    ? (normalized as CustomerOrderStatus)
    : null;
}

export function getCustomerOrderStatusLabel(value: unknown) {
  const status = normalizeCustomerOrderStatus(value);
  return status ? STATUS_LABELS[status] : "Order Status";
}

export function isCustomerCancellableStatus(status: unknown): status is CustomerCancellableOrderStatus {
  const normalized = typeof status === "string" ? status.trim().toLowerCase() : "";
  return (CUSTOMER_CANCELLABLE_ORDER_STATUSES as readonly string[]).includes(normalized);
}

export function getTimelineProgress(status: unknown) {
  const normalized = normalizeCustomerOrderStatus(status);
  if (!normalized) return 0;
  if (normalized === "delivered") return 7;
  if (normalized === "out_for_delivery") return 6;
  if (normalized === "shipped") return 5;
  if (normalized === "packed") return 4;
  if (normalized === "processing") return 3;
  if (normalized === "confirmed") return 2;
  if (normalized === "pending_payment") return 1;
  return 0;
}

export function isCustomerOrderTerminal(status: unknown) {
  const normalized = normalizeCustomerOrderStatus(status);
  return normalized === "payment_setup_failed" ||
    normalized === "payment_failed" ||
    normalized === "expired" ||
    normalized === "cancelled" ||
    normalized === "refunded";
}
