import test from "node:test";
import assert from "node:assert/strict";
import {
  mergeGuestIntoAccount,
  normalizeGuestCart,
} from "../src/lib/cart/merge";
import type {
  CartItem,
  GuestCartItem,
} from "../src/lib/cart/types";

function guest(
  overrides: Partial<GuestCartItem> = {},
): GuestCartItem {
  return {
    cartKey: "product-1::::{}:",
    productId: "product-1",
    qty: 1,
    quantity: 1,
    price: 999,
    ...overrides,
  };
}

function account(
  overrides: Partial<CartItem> = {},
): CartItem {
  return {
    cartKey: "product-1::::{}:",
    productId: "product-1",
    qty: 2,
    priceAtAdd: 999,
    ...overrides,
  };
}

function guestAsAccount(item: GuestCartItem): CartItem {
  return {
    cartKey: item.cartKey,
    productId: item.productId,
    qty: item.qty,
    priceAtAdd: item.price ?? 0,
    variantId: item.variantId,
    variant: item.variant,
    personalization: item.personalization,
    giftMessage: item.giftMessage,
    deliveryDate: item.deliveryDate,
    deliverySlot: item.deliverySlot,
    deliveryFee: item.deliveryFee ?? 0,
  };
}

test("normalizes legacy guest quantity to qty and quantity", () => {
  const items = normalizeGuestCart([
    guest({ qty: undefined, quantity: 1 }),
  ]);

  assert.equal(items[0].qty, 1);
  assert.equal(items[0].quantity, 1);
});

test("normalizes a guest item using qty when quantity is invalid", () => {
  const item = guest({
    qty: 4,
    quantity: Number.NaN,
  });

  const items = normalizeGuestCart([item]);

  assert.equal(items[0].qty, 4);
  assert.equal(items[0].quantity, 4);
});

test("merges duplicate cart keys and caps quantity at 20", () => {
  const result = mergeGuestIntoAccount(
    [account({ qty: 18 })],
    [account({ qty: 7 })],
  );

  assert.equal(result.length, 1);
  assert.equal(result[0].qty, 20);
});

test("keeps different personalization combinations separate", () => {
  const first = guest({
    cartKey: "product-1::::{\"name\":\"A\"}:",
    personalization: { name: "A" },
  });

  const second = guest({
    cartKey: "product-1::::{\"name\":\"B\"}:",
    personalization: { name: "B" },
  });

  const result = mergeGuestIntoAccount(
    [],
    [guestAsAccount(first), guestAsAccount(second)],
  );

  assert.equal(result.length, 2);
});

test("preserves variant and delivery combinations", () => {
  const first = guest({
    cartKey: "same-product-variant-a",
    variantId: "variant-a",
    deliveryDate: "2026-10-01",
    deliverySlot: "10:00-12:00",
  });

  const second = guest({
    cartKey: "same-product-variant-b",
    variantId: "variant-b",
    deliveryDate: "2026-10-02",
    deliverySlot: "14:00-16:00",
  });

  const result = mergeGuestIntoAccount(
    [],
    [guestAsAccount(first), guestAsAccount(second)],
  );

  assert.equal(result.length, 2);
  assert.equal(result[0].variantId, "variant-a");
  assert.equal(result[1].variantId, "variant-b");
});

test("does not lose guest message or personalization during merge", () => {
  const incoming = guest({
    giftMessage: "Happy birthday!",
    personalization: { name: "Riya" },
    deliveryDate: "2026-10-05",
    deliverySlot: "18:00-20:00",
  });

  const result = mergeGuestIntoAccount(
    [],
    [guestAsAccount(incoming)],
  );

  assert.equal(result[0].giftMessage, "Happy birthday!");
  assert.deepEqual(result[0].personalization, {
    name: "Riya",
  });
  assert.equal(result[0].deliveryDate, "2026-10-05");
  assert.equal(result[0].deliverySlot, "18:00-20:00");
});


test("cart merge rejects a zero or invalid priceAtAdd snapshot instead of producing bad account-cart data", () => {
  assert.throws(
    () => mergeGuestIntoAccount([], [account({ priceAtAdd: 0 })]),
    /Invalid cart price snapshot/,
  );

  assert.throws(
    () => mergeGuestIntoAccount([], [account({ priceAtAdd: Number.NaN })]),
    /Invalid cart price snapshot/,
  );
});

test("cart merge preserves the existing immutable price snapshot for duplicate items", () => {
  const result = mergeGuestIntoAccount(
    [account({ qty: 1, priceAtAdd: 999 })],
    [account({ qty: 1, priceAtAdd: 1499 })],
  );

  assert.equal(result[0].priceAtAdd, 999);
});
