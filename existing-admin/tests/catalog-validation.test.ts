import test from "node:test";
import assert from "node:assert/strict";
import { parseCategoryInput, parseProductInput, parseTaxonomyInput, slugify } from "../src/lib/catalog/validation";

test("slugify creates stable URL slugs", () => {
  assert.equal(slugify("  Luxury Rose Gift Box! "), "luxury-rose-gift-box");
});

test("product parser preserves required catalog arrays", () => {
  const product = parseProductInput({
    title: "Test Gift",
    sku: "T-1",
    price: 500,
    mrp: 700,
    status: "draft",
    categoryIds: ["a"],
    occasionIds: ["b"],
    recipientIds: ["c"],
    collectionIds: ["d"],
  });

  assert.equal(product.slug, "test-gift");
  assert.deepEqual(product.categoryIds, ["a"]);
  assert.equal(product.personalization.enabled, false);
});

test("live products require image, taxonomy and valid pricing", () => {
  assert.throws(
    () =>
      parseProductInput({
        title: "Live Gift",
        sku: "LIVE-1",
        price: 500,
        mrp: 700,
        status: "live",
        categoryIds: ["c1"],
        occasionIds: ["o1"],
        recipientIds: ["r1"],
      }),
    /At least one product image/,
  );

  assert.throws(
    () =>
      parseProductInput({
        title: "Live Gift",
        sku: "LIVE-2",
        price: 800,
        mrp: 700,
        status: "live",
        images: [{ url: "https://example.com/gift.jpg" }],
        categoryIds: ["c1"],
        occasionIds: ["o1"],
        recipientIds: ["r1"],
      }),
    /greater than MRP/,
  );
});

test("primary image must belong to the product image set", () => {
  assert.throws(
    () =>
      parseProductInput({
        title: "Draft Gift",
        sku: "DRAFT-1",
        price: 500,
        mrp: 700,
        status: "draft",
        images: [{ url: "https://example.com/one.jpg" }],
        thumbnail: "https://example.com/missing.jpg",
      }),
    /Primary image must be one of the product images/,
  );
});

function containsUndefined(value: unknown): boolean {
  if (value === undefined) return true;
  if (Array.isArray(value)) return value.some(containsUndefined);
  if (value && typeof value === "object") {
    return Object.values(value as Record<string, unknown>).some(containsUndefined);
  }
  return false;
}

test("taxonomy parser never emits undefined Firestore fields when optional inputs are blank", () => {
  const taxonomy = parseTaxonomyInput({ name: "Wedding Gifts", image: "", description: "" });
  assert.equal(containsUndefined(taxonomy), false);
  assert.equal("image" in taxonomy, false);
  assert.equal("description" in taxonomy, false);

  const category = parseCategoryInput({ name: "Photo Frames", parentId: "" });
  assert.equal(category.parentId, null);
  assert.equal(containsUndefined(category), false);
});

test("product parser preserves Product Editor variants and personalization without undefined fields", () => {
  const product = parseProductInput({
    title: "Personalised Frame",
    sku: "PF-1",
    price: 999,
    mrp: 1299,
    status: "draft",
    images: [{ url: "https://example.com/frame.jpg" }],
    variants: [{ name: "Size", value: "Large", price: 1199, sku: "PF-L" }],
    personalization: {
      enabled: true,
      fields: ["Name"],
      maxCharacters: 40,
      imageUpload: true,
    },
  });

  assert.equal(product.variants[0]?.value, "Large");
  assert.equal(product.variants[0]?.price, 1199);
  assert.deepEqual(product.personalization.fields, ["Name"]);
  assert.equal(product.personalization.maxCharacters, 40);
  assert.equal(product.personalization.imageUpload, true);
  assert.equal(containsUndefined(product), false);
});

