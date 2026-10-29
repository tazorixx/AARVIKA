import type { Product } from "@/lib/catalog/types";
import type { DeliverySelection } from "./DeliveryChecker";

export type PersonalizationValues = Record<string, string>;

export type ProductSelection = {
  variantId: string;
  quantity: number;
  giftMessage: string;
  personalization: PersonalizationValues;
  delivery: DeliverySelection | null;
};

export type ProductSelectionAction =
  | { type: "variant"; value: string }
  | { type: "quantity"; value: number }
  | { type: "giftMessage"; value: string }
  | { type: "personalization"; value: PersonalizationValues }
  | { type: "delivery"; value: DeliverySelection | null };

export function getVariantKey(
  variant: Product["variants"][number],
  index: number,
) {
  return (
    variant.id ||
    `${index}:${variant.name}:${variant.value || variant.options?.join(",") || ""}`
  );
}

export function getVariantPrice(
  product: Product,
  variant: Product["variants"][number] | undefined,
) {
  if (!variant) return product.price;
  if (typeof variant.price === "number" && Number.isFinite(variant.price)) {
    return variant.price;
  }
  return product.price + (variant.priceDelta ?? 0);
}

export function getInitialSelection(product: Product): ProductSelection {
  return {
    variantId: product.variants[0] ? getVariantKey(product.variants[0], 0) : "",
    quantity: 1,
    giftMessage: "",
    personalization: {},
    delivery: null,
  };
}

export function selectionReducer(
  state: ProductSelection,
  action: ProductSelectionAction,
): ProductSelection {
  switch (action.type) {
    case "variant":
      return { ...state, variantId: action.value };
    case "quantity":
      return {
        ...state,
        quantity: Math.max(1, Math.min(20, Math.round(action.value))),
      };
    case "giftMessage":
      return { ...state, giftMessage: action.value.slice(0, 250) };
    case "personalization":
      return { ...state, personalization: action.value };
    case "delivery":
      return { ...state, delivery: action.value };
    default:
      return state;
  }
}

export function formatPersonalization(values: PersonalizationValues) {
  return Object.entries(values)
    .filter(([, value]) => value.trim())
    .map(([field, value]) => `${field}: ${value.trim()}`)
    .join("\n");
}

export function hasRequiredPersonalization(
  product: Product,
  values: PersonalizationValues,
) {
  if (!product.personalization?.enabled) return true;

  const fields = product.personalization.fields?.filter(Boolean) ?? [];
  if (!fields.length) return Boolean(values.default?.trim());

  return fields.every((field) => Boolean(values[field]?.trim()));
}

export function validateSelection(
  product: Product,
  selection: ProductSelection,
) {
  if (product.variants.length > 0 && !selection.variantId) {
    return "Choose an option before adding this gift to your cart.";
  }

  // Personalisation is currently optional. The product model does not yet
  // expose a required/mandatory flag, so enabled personalisation must not
  // block Add to Cart or Buy Now when the customer leaves it blank.

  if (
    !selection.delivery?.pincode ||
    !selection.delivery.date ||
    !selection.delivery.slot
  ) {
    return "Check delivery and choose a date and time slot before continuing.";
  }

  return null;
}
