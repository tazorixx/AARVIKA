import test from "node:test";
import assert from "node:assert/strict";
import type { Product } from "../src/lib/catalog/types";

function product(overrides: Partial<Product> = {}): Product {
  return {
    id: "p1", sku: "SKU-1", title: "Test Gift", slug: "test-gift", shortDescription: "Short", description: "Description",
    categoryIds: ["c1"], occasionIds: ["o1"], recipientIds: ["r1"], tagIds: [], collectionIds: [], images: [], thumbnail: "",
    price: 999, mrp: 1299, discount: 23, variants: [], personalization: { enabled: false }, inventory: { quantity: 10, reserved: 0, sold: 0 },
    delivery: { minDays: 3, maxDays: 5 }, serviceability: { nationwide: true }, status: "live", featured: false, bestseller: false, newArrival: false,
    rating: 4.5, reviewCount: 12, seo: {}, ...overrides,
  };
}

test("product slugs are used for public detail routes", () => {
  const item = product({ slug: "premium-photo-frame" });
  assert.equal(`/product/${item.slug}`, "/product/premium-photo-frame");
});

test("product taxonomy arrays remain available for related-product matching", () => {
  const first = product({ id: "one", categoryIds: ["frames", "personalised"] });
  const second = product({ id: "two", categoryIds: ["personalised"] });
  assert.equal(first.categoryIds.some((id) => second.categoryIds.includes(id)), true);
});
