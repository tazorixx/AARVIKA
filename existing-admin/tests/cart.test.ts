import test from "node:test";
import assert from "node:assert/strict";
import { cartCount } from "../src/lib/cart/storage";
import {
  createCartKey,
  getCartQuantity,
  normalizeCartQuantity,
} from "../src/lib/cart/types";

test("cart key changes when delivery or personalization changes", () => {
  const base = { productId: "p1", variantId: "v1", deliveryDate: "2026-09-20", deliverySlot: "10-12", personalization: { name: "A" } };
  assert.equal(createCartKey(base), createCartKey({ ...base }));
  assert.notEqual(createCartKey(base), createCartKey({ ...base, deliverySlot: "14-16" }));
  assert.notEqual(createCartKey(base), createCartKey({ ...base, personalization: { name: "B" } }));
});

test("cart quantity is capped at 20 and never falls below one", () => {
  assert.equal(normalizeCartQuantity(99), 20);
  assert.equal(normalizeCartQuantity(0), 1);
  assert.equal(normalizeCartQuantity("3.8"), 3);
  assert.equal(normalizeCartQuantity("bad"), 1);
});


test("cart quantity prefers canonical qty and falls back to legacy quantity", () => {
  assert.equal(getCartQuantity({ qty: 4, quantity: 1 }), 4);
  assert.equal(getCartQuantity({ qty: "5", quantity: 2 }), 5);
  assert.equal(getCartQuantity({ qty: "bad", quantity: 3 }), 3);
  assert.equal(getCartQuantity({ quantity: 6 }), 6);
});

test("cart count uses canonical qty consistently", () => {
  assert.equal(
    cartCount([
      { qty: 2, quantity: 9 },
      { qty: 3 },
    ]),
    5,
  );

  assert.equal(
    cartCount([
      { qty: 99, quantity: 1 },
      { quantity: 0 },
    ]),
    21,
  );
});
