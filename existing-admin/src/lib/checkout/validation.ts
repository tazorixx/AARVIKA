import type { Product, ProductDelivery } from "@/lib/catalog/types";
import { normalizeCartQuantity, type CartItem } from "@/lib/cart/types";
import type { CheckoutAddress, CheckoutDeliverySelection } from "./types";
import { isBeforeDeliveryCutoff } from "./delivery-rules";

export const STANDARD_DELIVERY_SLOTS = [
  "9 AM – 12 PM",
  "12 PM – 3 PM",
  "3 PM – 6 PM",
  "6 PM – 9 PM",
] as const;

export const MIDNIGHT_DELIVERY_SLOT = "10 PM – 12 AM" as const;

export type DeliverySlot =
  | (typeof STANDARD_DELIVERY_SLOTS)[number]
  | typeof MIDNIGHT_DELIVERY_SLOT;

export function isValidPincode(value: unknown) {
  return typeof value === "string" && /^\d{6}$/.test(value.trim());
}

export function isServiceable(product: Product, pincode: string, city?: string) {
  const serviceability = product.serviceability;
  if (serviceability?.nationwide !== false) return true;

  const normalizedPincode = pincode.trim();
  const normalizedCity = city?.trim().toLowerCase();

  if (serviceability?.pincodes?.includes(normalizedPincode)) return true;

  return Boolean(
    normalizedCity &&
      serviceability?.cities?.some(
        (candidate) => candidate.trim().toLowerCase() === normalizedCity,
      ),
  );
}

function parseDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function todayAtMidnight() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

export function isSupportedDeliveryDate(product: Pick<Product, "delivery">, value: string) {
  const selected = parseDate(value);
  if (!selected) return false;

  const today = todayAtMidnight();
  const diffDays = Math.round(
    (selected.getTime() - today.getTime()) / 86_400_000,
  );

  const minDays = product.delivery?.sameDay
    ? 0
    : Math.max(0, product.delivery?.minDays ?? 2);
  const maxDays = Math.max(minDays, product.delivery?.maxDays ?? minDays + 14);

  return diffDays >= minDays && diffDays <= maxDays;
}

export function supportedDeliverySlots(product: Pick<Product, "delivery">): DeliverySlot[] {
  const slots: DeliverySlot[] = [...STANDARD_DELIVERY_SLOTS];
  if (product.delivery?.midnight) slots.push(MIDNIGHT_DELIVERY_SLOT);
  return slots;
}

export function isSupportedDeliverySlot(product: Pick<Product, "delivery">, slot: string) {
  return supportedDeliverySlots(product).includes(slot as DeliverySlot);
}

export function validateAddress(address: unknown): address is CheckoutAddress {
  if (!address || typeof address !== "object") return false;
  const value = address as Record<string, unknown>;
  return (
    typeof value.name === "string" && value.name.trim().length > 0 &&
    typeof value.phone === "string" && value.phone.trim().length > 0 &&
    typeof value.addressLine === "string" && value.addressLine.trim().length > 0 &&
    typeof value.city === "string" && value.city.trim().length > 0 &&
    typeof value.state === "string" && value.state.trim().length > 0 &&
    isValidPincode(value.pincode)
  );
}

export function validateDeliverySelection(
  product: Product,
  item: CartItem,
  selection: CheckoutDeliverySelection,
) {
  if (selection.cartKey !== item.cartKey) {
    return "That delivery selection does not match this gift.";
  }
  if (!isValidPincode(selection.pincode)) {
    return "Enter a valid 6-digit delivery pincode.";
  }
  if (!isServiceable(product, selection.pincode)) {
    return "This gift is not currently serviceable to the selected pincode.";
  }
  if (!selection.date || !isSupportedDeliveryDate(product, selection.date)) {
    return "Choose a delivery date supported by this gift.";
  }
  if (!isBeforeDeliveryCutoff(product, selection.date)) {
    return "The same-day delivery cutoff has passed. Choose another delivery date.";
  }
  if (!selection.slot || !isSupportedDeliverySlot(product, selection.slot)) {
    return "Choose a delivery time slot supported by this gift.";
  }
  if (normalizeCartQuantity(item.qty) < 1) {
    return "Cart quantity is invalid.";
  }
  return null;
}
