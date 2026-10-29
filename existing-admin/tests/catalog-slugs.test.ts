import test from "node:test";
import assert from "node:assert/strict";

import { slugLockId } from "../src/lib/catalog/slugs";

test("slug locks are namespaced by entity type", () => {
  assert.equal(
    slugLockId("products", "rose-box"),
    "products_rose-box",
  );

  assert.equal(
    slugLockId("categories", "rose-box"),
    "categories_rose-box",
  );

  assert.notEqual(
    slugLockId("products", "rose-box"),
    slugLockId("categories", "rose-box"),
  );
});

test("slug lock IDs are deterministic", () => {
  assert.equal(
    slugLockId("products", "personalised-photo-frame"),
    "products_personalised-photo-frame",
  );

  assert.equal(
    slugLockId("products", "personalised-photo-frame"),
    slugLockId(
      "products",
      "personalised-photo-frame",
    ),
  );
});