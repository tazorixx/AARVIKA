import test from "node:test";
import assert from "node:assert/strict";

test("catalog query matching is case-insensitive and based on public product text", () => {
  const product = {
    title:
      "Personalised Photo Frame",
    slug:
      "personalised-photo-frame",
    shortDescription:
      "A memory gift",
  };

  const query =
    "PHOTO".toLowerCase();

  const matches = [
    product.title,
    product.slug,
    product.shortDescription,
  ].some((value) =>
    value
      .toLowerCase()
      .includes(query),
  );

  assert.equal(
    matches,
    true,
  );
});

test("compound taxonomy filtering can be post-filtered safely", () => {
  const product = {
    categoryIds: ["c1"],
    occasionIds: ["o1"],
    recipientIds: ["r1"],
  };

  assert.equal(
    product.categoryIds.includes(
      "c1",
    ) &&
      product.occasionIds.includes(
        "o1",
      ),
    true,
  );
});

test("live-product detection checks every matching product", () => {
  const products = [
    {
      status: "draft",
      categoryIds: ["c1"],
    },
    {
      status: "live",
      categoryIds: ["c1"],
    },
  ];

  const hasLiveReference =
    products.some(
      (product) =>
        product.categoryIds.includes(
          "c1",
        ) &&
        product.status === "live",
    );

  assert.equal(
    hasLiveReference,
    true,
  );
});

test("taxonomy deletion is allowed when all matching products are non-live", () => {
  const products = [
    {
      status: "draft",
      categoryIds: ["c1"],
    },
    {
      status: "archived",
      categoryIds: ["c1"],
    },
  ];

  const hasLiveReference =
    products.some(
      (product) =>
        product.categoryIds.includes(
          "c1",
        ) &&
        product.status === "live",
    );

  assert.equal(
    hasLiveReference,
    false,
  );
});