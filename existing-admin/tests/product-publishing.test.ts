import test from "node:test";
import assert from "node:assert/strict";
import { validateProductForPublish } from "../src/lib/catalog/validation";

type ProductInput = Parameters<typeof validateProductForPublish>[0];

function product(overrides: Partial<ProductInput> = {}): ProductInput {
  return {
    sku: "GIFT-001",
    title: "Birthday Gift",
    slug: "birthday-gift",
    shortDescription: "Gift",
    description: "Birthday gift",
    categoryIds: ["cat-1"],
    occasionIds: ["occ-1"],
    recipientIds: ["rec-1"],
    tagIds: [],
    collectionIds: [],
    images: [{ url: "https://example.com/gift.jpg" }],
    thumbnail: "https://example.com/gift.jpg",
    price: 799,
    mrp: 999,
    discount: 200,
    variants: [],
    personalization: { enabled: false },
    inventory: { quantity: 10, reserved: 0, sold: 0 },
    delivery: { minDays: 2, maxDays: 5 },
    serviceability: { nationwide: true },
    status: "live",
    featured: false,
    bestseller: false,
    newArrival: true,
    rating: 0,
    reviewCount: 0,
    seo: {},
    ...overrides,
  };
}

test("product publishing accepts a complete product", () => {
  assert.doesNotThrow(() => validateProductForPublish(product()));
});

test("product publishing requires image and taxonomy", () => {
  assert.throws(() => validateProductForPublish(product({ images: [], thumbnail: "" })), /image/i);
  assert.throws(() => validateProductForPublish(product({ categoryIds: [] })), /category/i);
  assert.throws(() => validateProductForPublish(product({ occasionIds: [] })), /occasion/i);
  assert.throws(() => validateProductForPublish(product({ recipientIds: [] })), /recipient/i);
});

test("product publishing rejects invalid pricing and primary image", () => {
  assert.throws(() => validateProductForPublish(product({ price: 1200, mrp: 999 })), /greater than MRP/i);
  assert.throws(() => validateProductForPublish(product({ thumbnail: "https://example.com/other.jpg" })), /primary product image/i);
});
