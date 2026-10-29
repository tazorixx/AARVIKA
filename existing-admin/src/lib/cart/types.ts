export type CartPersonalization = Record<string, string>;

export type CartItem = {
  cartKey: string;
  productId: string;
  qty: number;
  priceAtAdd: number;
  pricingVersion?: number;
  title?: string;
  image?: string;
  variantId?: string;
  variant?: string;
  personalization?: CartPersonalization;
  giftMessage?: string;
  deliveryDate?: string;
  deliverySlot?: string;
  deliveryFee?: number;
};

export type GuestCartItem = Omit<CartItem, "priceAtAdd"> & {
  price?: number;
  quantity: number;
};

export type CartDocument = {
  items: CartItem[];
  updatedAt?: unknown;
};

export const MAX_CART_QTY = 20;
export const MAX_CART_ITEMS = 100;

export function normalizeCartQuantity(value: unknown) {
  const quantity = Number(value);
  if (!Number.isFinite(quantity)) return 1;
  return Math.max(1, Math.min(MAX_CART_QTY, Math.floor(quantity)));
}

export function getCartQuantity(item: {
  qty?: unknown;
  quantity?: unknown;
}) {
  // `qty` is the canonical cart quantity.
  // Fall back to `quantity` for older guest-cart data when `qty` is absent/invalid.
  if (item.qty !== undefined) {
    const qty = Number(item.qty);
    if (Number.isFinite(qty)) {
      return normalizeCartQuantity(qty);
    }
  }

  return normalizeCartQuantity(item.quantity);
}

export function isValidCartPrice(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

export function createCartKey(item: {
  productId: string;
  variantId?: string;
  deliveryDate?: string;
  deliverySlot?: string;
  personalization?: CartPersonalization;
  giftMessage?: string;
}) {
  return [
    item.productId,
    item.variantId || "",
    item.deliveryDate || "",
    item.deliverySlot || "",
    JSON.stringify(item.personalization || {}),
    item.giftMessage || "",
  ].join(":");
}
