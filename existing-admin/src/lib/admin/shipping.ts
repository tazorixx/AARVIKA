import type { AdminRole } from "@/lib/firebase-admin";

export const SHIPPING_ADMIN_ROLES: AdminRole[] = ["SUPER_ADMIN", "ADMIN", "ORDER_MANAGER"];
export const SHIPMENT_STATUSES = ["ready", "label_created", "picked_up", "in_transit", "out_for_delivery", "delivered", "exception"] as const;
export type ShipmentStatus = (typeof SHIPMENT_STATUSES)[number];

export function canManageShipping(role: unknown) {
  return typeof role === "string" && SHIPPING_ADMIN_ROLES.includes(role as AdminRole);
}

export function normalizeShipmentStatus(value: unknown): ShipmentStatus | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  return (SHIPMENT_STATUSES as readonly string[]).includes(normalized)
    ? (normalized as ShipmentStatus)
    : null;
}

export function validateShipmentInput(body: Record<string, unknown>) {
  const courier = typeof body.courier === "string" ? body.courier.trim().slice(0, 100) : "";
  const trackingNumber = typeof body.trackingNumber === "string" ? body.trackingNumber.trim().slice(0, 150) : "";
  const trackingUrl = typeof body.trackingUrl === "string" ? body.trackingUrl.trim().slice(0, 500) : "";
  const status = body.status === undefined ? "ready" : normalizeShipmentStatus(body.status);

  if (!courier) return { valid: false as const, error: "Courier name is required." };
  if (!trackingNumber) return { valid: false as const, error: "Tracking number is required." };
  if (body.trackingUrl !== undefined && trackingUrl) {
    try {
      const url = new URL(trackingUrl);
      if (!/^https?:$/.test(url.protocol)) throw new Error("bad protocol");
    } catch {
      return { valid: false as const, error: "Tracking URL must be a valid HTTP or HTTPS URL." };
    }
  }
  if (!status) return { valid: false as const, error: "Invalid shipment status." };

  return { valid: true as const, courier, trackingNumber, trackingUrl, status };
}
