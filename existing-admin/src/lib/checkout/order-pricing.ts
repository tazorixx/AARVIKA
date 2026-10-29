import { isValidCartPrice, type CartItem } from "@/lib/cart/types";

export const INVALID_CART_PRICE_MESSAGE =
  "This item’s saved price is no longer valid. Please remove it from your cart and add it again before checkout.";

export function validateCartPriceSnapshots(items: CartItem[]) {
  const invalid = items.find((item) => !isValidCartPrice(item.priceAtAdd));
  if (!invalid) return { valid: true as const };

  return {
    valid: false as const,
    item: invalid,
    message: `${INVALID_CART_PRICE_MESSAGE} Affected item: "${invalid.title || invalid.productId}".`,
  };
}
