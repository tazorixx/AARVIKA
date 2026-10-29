import type { CartItem, GuestCartItem } from "./types";
import {
  getCartQuantity,
  normalizeCartQuantity,
  type CartPersonalization,
} from "./types";
import { normalizeGuestCart } from "./merge";

export const CART_STORAGE_KEY = "gift4u-cart";
export const CART_UPDATED_EVENT = "cartUpdated";

function isBrowser() {
  return typeof window !== "undefined";
}

function sanitizePersonalization(value: unknown): CartPersonalization | undefined {
  if (!value || typeof value !== "object") return undefined;

  const entries = Object.entries(value).filter(
    ([key, val]) =>
      key.trim().length > 0 &&
      typeof val === "string",
  );

  return entries.length > 0
    ? Object.fromEntries(entries)
    : undefined;
}

function normalizeStoredItem(value: unknown): GuestCartItem | null {
  if (!value || typeof value !== "object") return null;

  const raw = value as Record<string, unknown>;
  const productId =
    typeof raw.productId === "string"
      ? raw.productId.trim()
      : "";
  const cartKey =
    typeof raw.cartKey === "string"
      ? raw.cartKey
      : "";

  if (!productId || !cartKey) return null;

  const quantity = getCartQuantity({
    qty: raw.qty,
    quantity: raw.quantity,
  });

  const price = Number(raw.price);

  return {
    cartKey,
    productId,
    qty: quantity,
    quantity,
    price:
      Number.isFinite(price) && price >= 0
        ? price
        : undefined,
    title:
      typeof raw.title === "string"
        ? raw.title
        : undefined,
    image:
      typeof raw.image === "string"
        ? raw.image
        : undefined,
    variantId:
      typeof raw.variantId === "string"
        ? raw.variantId
        : undefined,
    variant:
      typeof raw.variant === "string"
        ? raw.variant
        : undefined,
    personalization: sanitizePersonalization(
      raw.personalization,
    ),
    giftMessage:
      typeof raw.giftMessage === "string"
        ? raw.giftMessage.slice(0, 500)
        : undefined,
    deliveryDate:
      typeof raw.deliveryDate === "string"
        ? raw.deliveryDate
        : undefined,
    deliverySlot:
      typeof raw.deliverySlot === "string"
        ? raw.deliverySlot
        : undefined,
    deliveryFee:
      typeof raw.deliveryFee === "number" &&
      Number.isFinite(raw.deliveryFee) &&
      raw.deliveryFee >= 0
        ? raw.deliveryFee
        : 0,
  };
}

export function readGuestCart(): GuestCartItem[] {
  if (!isBrowser()) return [];

  try {
    const parsed = JSON.parse(
      localStorage.getItem(CART_STORAGE_KEY) || "[]",
    );

    if (!Array.isArray(parsed)) return [];

    const normalized = parsed
      .map(normalizeStoredItem)
      .filter(
        (item): item is GuestCartItem =>
          Boolean(item),
      );

    return normalizeGuestCart(normalized);
  } catch {
    return [];
  }
}

export function writeGuestCart(
  items: GuestCartItem[],
) {
  if (!isBrowser()) return;

  const normalized = normalizeGuestCart(items);

  localStorage.setItem(
    CART_STORAGE_KEY,
    JSON.stringify(normalized),
  );

  window.dispatchEvent(
    new Event(CART_UPDATED_EVENT),
  );
}

export function clearGuestCart() {
  if (!isBrowser()) return;

  localStorage.removeItem(CART_STORAGE_KEY);
  window.dispatchEvent(
    new Event(CART_UPDATED_EVENT),
  );
}

export function guestCartToServerItems(
  items: GuestCartItem[],
) {
  return normalizeGuestCart(items).map((item) => ({
    cartKey: item.cartKey,
    productId: item.productId,
    qty: getCartQuantity(item),
    variantId: item.variantId,
    variant: item.variant,
    personalization: item.personalization,
    giftMessage: item.giftMessage,
    deliveryDate: item.deliveryDate,
    deliverySlot: item.deliverySlot,
    deliveryFee: item.deliveryFee,
  }));
}

export function cartCount(
  items: Array<
    Pick<CartItem, "qty"> | Pick<GuestCartItem, "quantity">
  >,
) {
  return items.reduce(
    (sum, item) => sum + getCartQuantity(item),
    0,
  );
}
