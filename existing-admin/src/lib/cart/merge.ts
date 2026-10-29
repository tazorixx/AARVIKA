import {
  MAX_CART_ITEMS,
  MAX_CART_QTY,
  getCartQuantity,
  isValidCartPrice,
  normalizeCartQuantity,
  type CartItem,
  type GuestCartItem,
} from "./types";

export function normalizeGuestCartItem(
  item: GuestCartItem,
): GuestCartItem {
  const quantity = getCartQuantity(item);

  return {
    ...item,
    qty: quantity,
    quantity,
    price:
      typeof item.price === "number" &&
      Number.isFinite(item.price) &&
      item.price >= 0
        ? item.price
        : undefined,
    deliveryFee:
      typeof item.deliveryFee === "number" &&
      Number.isFinite(item.deliveryFee) &&
      item.deliveryFee >= 0
        ? item.deliveryFee
        : 0,
  };
}

export function normalizeGuestCart(
  items: GuestCartItem[],
): GuestCartItem[] {
  const normalized: GuestCartItem[] = [];

  for (const rawItem of items) {
    if (!rawItem || typeof rawItem !== "object") continue;
    if (!rawItem.productId || !rawItem.cartKey) continue;

    const item = normalizeGuestCartItem(rawItem);
    const existing = normalized.find(
      (candidate) => candidate.cartKey === item.cartKey,
    );

    if (existing) {
      const quantity = Math.min(
        MAX_CART_QTY,
        getCartQuantity(existing) +
          getCartQuantity(item),
      );
      existing.qty = quantity;
      existing.quantity = quantity;
      existing.price = item.price ?? existing.price;
      existing.deliveryFee =
        item.deliveryFee ?? existing.deliveryFee ?? 0;
    } else {
      normalized.push(item);
    }

    if (normalized.length >= MAX_CART_ITEMS) break;
  }

  return normalized;
}

export function mergeGuestIntoAccount(
  current: CartItem[],
  incoming: CartItem[],
): CartItem[] {
  for (const existingItem of current) {
    if (!isValidCartPrice(existingItem.priceAtAdd)) {
      throw new Error(`Invalid existing cart price snapshot for "${existingItem.title || existingItem.productId}".`);
    }
  }

  const merged = current.map((item) => ({
    ...item,
    qty: normalizeCartQuantity(item.qty),
  }));

  for (const rawItem of incoming) {
    if (!isValidCartPrice(rawItem.priceAtAdd)) {
      throw new Error(`Invalid cart price snapshot for "${rawItem.title || rawItem.productId}".`);
    }

    const item = {
      ...rawItem,
      qty: normalizeCartQuantity(rawItem.qty),
    };

    const existing = merged.find(
      (candidate) => candidate.cartKey === item.cartKey,
    );

    if (existing) {
      existing.qty = Math.min(
        MAX_CART_QTY,
        normalizeCartQuantity(existing.qty) + item.qty,
      );
      existing.variantId = item.variantId;
      existing.variant = item.variant;
      existing.personalization = item.personalization;
      existing.giftMessage = item.giftMessage;
      existing.deliveryDate = item.deliveryDate;
      existing.deliverySlot = item.deliverySlot;
      existing.deliveryFee = item.deliveryFee ?? 0;
      // Legacy variant cart rows created before server-authoritative variant pricing
      // can be upgraded only when the same cart key is re-added through the new
      // trusted pricing path. New v2 snapshots remain immutable after capture.
      if (item.pricingVersion === 2 && existing.pricingVersion !== 2) {
        existing.priceAtAdd = item.priceAtAdd;
        existing.pricingVersion = 2;
      }
      // Preserve the existing immutable price snapshot for already-migrated rows.
    } else if (merged.length < MAX_CART_ITEMS) {
      merged.push(item);
    }
  }

  return merged.slice(0, MAX_CART_ITEMS);
}
