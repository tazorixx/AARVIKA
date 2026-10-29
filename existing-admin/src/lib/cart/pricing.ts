import type { Product, ProductVariant } from "@/lib/catalog/types";

export const CART_PRICING_VERSION = 2 as const;

export function getCatalogVariantKey(variant: ProductVariant, index: number) {
  return variant.id || `${index}:${variant.name}:${variant.value || variant.options?.join(",") || ""}`;
}

function variantLabel(variant: ProductVariant) {
  const detail = variant.value || (variant.options?.length ? variant.options.join(", ") : "");
  return detail ? `${variant.name} — ${detail}` : variant.name;
}

export function resolveAuthoritativeCartSelection(product: Product, requestedVariantId?: string) {
  const basePrice = Number(product.price);
  if (!Number.isFinite(basePrice) || basePrice <= 0) {
    throw new Error(`Unable to add "${product.title || product.id}" because its price is unavailable.`);
  }

  const variants = Array.isArray(product.variants) ? product.variants : [];
  if (variants.length === 0) {
    if (requestedVariantId?.trim()) {
      throw new Error(`The selected option for "${product.title || product.id}" is no longer available.`);
    }
    return {
      price: basePrice,
      variantId: undefined,
      variant: undefined,
      pricingVersion: CART_PRICING_VERSION,
    };
  }

  const variantId = requestedVariantId?.trim() || "";
  if (!variantId) {
    throw new Error(`Choose an available option for "${product.title || product.id}" before adding it to your cart.`);
  }

  const index = variants.findIndex((variant, variantIndex) => getCatalogVariantKey(variant, variantIndex) === variantId);
  if (index < 0) {
    throw new Error(`The selected option for "${product.title || product.id}" is no longer available.`);
  }

  const selected = variants[index];
  const explicitPrice = Number(selected.price);
  const delta = Number(selected.priceDelta ?? 0);
  const price = typeof selected.price === "number" && Number.isFinite(explicitPrice)
    ? explicitPrice
    : basePrice + (Number.isFinite(delta) ? delta : 0);

  if (!Number.isFinite(price) || price <= 0) {
    throw new Error(`The selected option for "${product.title || product.id}" has an invalid price.`);
  }

  return {
    price,
    variantId,
    variant: variantLabel(selected),
    pricingVersion: CART_PRICING_VERSION,
  };
}

export function validateStoredVariantSelection(product: Product, item: { variantId?: string; pricingVersion?: number }) {
  const variants = Array.isArray(product.variants) ? product.variants : [];
  if (variants.length === 0) return { valid: true as const };

  if (item.pricingVersion !== CART_PRICING_VERSION) {
    return {
      valid: false as const,
      message: `The option price for "${product.title || product.id}" needs to be refreshed. Remove it from your cart and add it again.`,
    };
  }

  const variantId = item.variantId?.trim() || "";
  const exists = variants.some((variant, index) => getCatalogVariantKey(variant, index) === variantId);
  if (!variantId || !exists) {
    return {
      valid: false as const,
      message: `The selected option for "${product.title || product.id}" is no longer available. Remove it from your cart and choose another option.`,
    };
  }

  return { valid: true as const };
}
