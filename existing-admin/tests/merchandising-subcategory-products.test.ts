import test from "node:test";
import assert from "node:assert/strict";

import type { Product, TaxonomyBase } from "../src/lib/catalog/types";
import type { MerchandisingItem } from "../src/lib/merchandising/types";
import { productMatchesMerchandisingItem, productsForMerchandisingPage } from "../src/lib/merchandising/product-query";

function product(overrides: Partial<Product> = {}): Product {
  return {
    id: "p1",
    sku: "SKU-1",
    title: "Test gift",
    slug: "test-gift",
    shortDescription: "",
    description: "",
    occasionIds: ["wedding-occ"],
    categoryIds: ["frames"],
    recipientIds: ["couples"],
    collectionIds: ["premium"],
    cultureTagIds: ["culture-muslim"],
    stateTagIds: ["state-maharashtra"],
    tagIds: ["age-group:18th-birthday", "personality:fashionista"],
    images: [],
    thumbnail: "",
    price: 1299,
    mrp: 1299,
    discount: 0,
    variants: [],
    personalization: { enabled: true },
    inventory: { quantity: 10, reserved: 0, sold: 0 },
    delivery: {},
    serviceability: {},
    status: "live",
    featured: false,
    bestseller: false,
    newArrival: false,
    rating: 0,
    reviewCount: 0,
    seo: {},
    ...overrides,
  };
}

function item(overrides: Partial<MerchandisingItem>): MerchandisingItem {
  return {
    id: "item-1",
    page: "wedding",
    type: "category",
    name: "Item",
    slug: "item",
    sortOrder: 1,
    active: true,
    ...overrides,
  };
}

test("merchandising collection matching uses stable CMS item relationships", () => {
  const value = product();
  assert.equal(productMatchesMerchandisingItem(value, item({
    id: "culture-muslim", page: "wedding", type: "culture", name: "Muslim Wedding", slug: "muslim-wedding",
  })), true);
  assert.equal(productMatchesMerchandisingItem(value, item({
    id: "category-frames", page: "wedding", type: "category", name: "Frames", slug: "frames", relatedId: "frames", sortOrder: 2,
  })), true);
  assert.equal(productMatchesMerchandisingItem(value, item({
    id: "budget-mid", page: "wedding", type: "budget", name: "Under 1500", slug: "under-1500", max: 1500, sortOrder: 3,
  })), true);
});

test("tag-backed merchandising types match exact normalized admin tag IDs instead of product text", () => {
  const value = product();
  assert.equal(productMatchesMerchandisingItem(value, item({
    id: "age-18", page: "birthday", type: "ageGroup", name: "18th Birthday", slug: "18th-birthday",
  })), true);
  assert.equal(productMatchesMerchandisingItem(value, item({
    id: "fashionista", page: "lifestyle", type: "personality", name: "Fashionista", slug: "fashionista",
  })), true);
  assert.equal(productMatchesMerchandisingItem(value, item({
    id: "gamer", page: "lifestyle", type: "personality", name: "Gamer", slug: "gamer", sortOrder: 2,
  })), false);
});

test("parent merchandising page scope is applied before subcategory matching", () => {
  const values: Product[] = [
    product({ id: "wedding", occasionIds: ["wedding-occ"] }),
    product({ id: "birthday", occasionIds: ["birthday-occ"] }),
  ];
  const occasions: TaxonomyBase[] = [{
    id: "wedding-occ",
    name: "Wedding",
    slug: "wedding",
    sortOrder: 1,
    active: true,
  }];
  const collections: TaxonomyBase[] = [];

  const scoped = productsForMerchandisingPage("wedding", values, occasions, collections);
  assert.deepEqual(scoped.map((entry) => entry.id), ["wedding"]);
});
