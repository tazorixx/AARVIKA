import test from "node:test";
import assert from "node:assert/strict";
import type { Product } from "../src/lib/catalog/types";
import type { CartItem } from "../src/lib/cart/types";
import {
  isServiceable,
  isSupportedDeliveryDate,
  isSupportedDeliverySlot,
  isValidPincode,
  validateAddress,
  validateDeliverySelection,
} from "../src/lib/checkout/validation";

const baseProduct: Product = {
  id: "p1",
  sku: "SKU-1",
  title: "Test Gift",
  slug: "test-gift",
  shortDescription: "Test",
  description: "Test",
  categoryIds: [],
  occasionIds: [],
  recipientIds: [],
  tagIds: [],
  collectionIds: [],
  images: [],
  thumbnail: "",
  price: 1000,
  mrp: 1200,
  discount: 17,
  variants: [],
  personalization: { enabled: false },
  inventory: { quantity: 10, reserved: 0, sold: 0 },
  delivery: { minDays: 2, maxDays: 7, midnight: false },
  serviceability: { nationwide: true },
  status: "live",
  featured: false,
  bestseller: false,
  newArrival: false,
  rating: 0,
  reviewCount: 0,
  seo: {},
};

const item: CartItem = {
  cartKey: "p1::::{}:",
  productId: "p1",
  qty: 2,
  priceAtAdd: 1000,
};

test("accepts valid six-digit pincodes", () => {
  assert.equal(isValidPincode("411001"), true);
  assert.equal(isValidPincode("41101"), false);
});

test("serviceability respects nationwide, pincodes, and configured cities", () => {
  assert.equal(isServiceable(baseProduct, "411001"), true);
  const restricted = {
    ...baseProduct,
    serviceability: { nationwide: false, pincodes: ["411001"], cities: ["Pune"] },
  };
  assert.equal(isServiceable(restricted, "411001"), true);
  assert.equal(isServiceable(restricted, "400001"), false);
  assert.equal(isServiceable(restricted, "400001", "Pune"), true);
  assert.equal(isServiceable(restricted, "400001", "Mumbai"), false);
});

test("delivery dates stay inside the product-supported window", () => {
  assert.equal(isSupportedDeliveryDate(baseProduct, new Date(Date.now() + 3 * 86_400_000).toISOString().slice(0, 10)), true);
  assert.equal(isSupportedDeliveryDate(baseProduct, new Date(Date.now() + 1 * 86_400_000).toISOString().slice(0, 10)), false);
});

test("delivery slots respect product midnight capability", () => {
  assert.equal(isSupportedDeliverySlot(baseProduct, "9 AM – 12 PM"), true);
  assert.equal(isSupportedDeliverySlot(baseProduct, "10 PM – 12 AM"), false);
  assert.equal(isSupportedDeliverySlot({ ...baseProduct, delivery: { ...baseProduct.delivery, midnight: true } }, "10 PM – 12 AM"), true);
});

test("address validation requires recipient and six-digit pincode", () => {
  assert.equal(validateAddress({ name: "A", phone: "9999999999", addressLine: "Street", city: "Pune", state: "Maharashtra", pincode: "411001" }), true);
  assert.equal(validateAddress({ name: "A", phone: "9999999999", addressLine: "Street", city: "Pune", state: "Maharashtra", pincode: "41100" }), false);
});

test("delivery selection validation rejects wrong pincode, date, and slot", () => {
  const date = new Date(Date.now() + 3 * 86_400_000).toISOString().slice(0, 10);
  const valid = { cartKey: item.cartKey, pincode: "411001", date, slot: "9 AM – 12 PM" };
  assert.equal(validateDeliverySelection(baseProduct, item, valid), null);
  const restrictedProduct = {
    ...baseProduct,
    serviceability: { nationwide: false, pincodes: ["411001"] },
  };
  assert.match(validateDeliverySelection(restrictedProduct, item, { ...valid, pincode: "400001" }) || "", /serviceable/i);
  assert.match(validateDeliverySelection(baseProduct, item, { ...valid, date: new Date(Date.now() + 1 * 86_400_000).toISOString().slice(0, 10) }) || "", /date/i);
  assert.match(validateDeliverySelection(baseProduct, item, { ...valid, slot: "10 PM – 12 AM" }) || "", /slot/i);
});
