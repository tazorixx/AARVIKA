import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { canManageOrders, isValidFulfillmentTransition } from "../src/lib/admin/orders";
import { INVALID_CART_PRICE_MESSAGE, validateCartPriceSnapshots } from "../src/lib/checkout/order-pricing";

test("admin order roles authorize only order operators", () => {
  assert.equal(canManageOrders("SUPER_ADMIN"), true);
  assert.equal(canManageOrders("ADMIN"), true);
  assert.equal(canManageOrders("ORDER_MANAGER"), true);
  assert.equal(canManageOrders("CATALOG_MANAGER"), false);
  assert.equal(canManageOrders("SUPPORT"), false);
});

test("fulfillment status transitions are sequential", () => {
  assert.equal(isValidFulfillmentTransition("confirmed", "processing"), true);
  assert.equal(isValidFulfillmentTransition("processing", "packed"), true);
  assert.equal(isValidFulfillmentTransition("packed", "shipped"), true);
  assert.equal(isValidFulfillmentTransition("processing", "shipped"), false);
  assert.equal(isValidFulfillmentTransition("shipped", "out_for_delivery"), true);
  assert.equal(isValidFulfillmentTransition("out_for_delivery", "delivered"), true);
  assert.equal(isValidFulfillmentTransition("shipped", "delivered"), false);
  assert.equal(isValidFulfillmentTransition("confirmed", "delivered"), false);
  assert.equal(isValidFulfillmentTransition("delivered", "processing"), false);
});

test("cart merge/order price regression rejects zero snapshot", () => {
  const result = validateCartPriceSnapshots([{ cartKey: "x", productId: "p1", qty: 1, priceAtAdd: 0, title: "Gift" }]);
  assert.equal(result.valid, false);
  assert.match(result.message, new RegExp(INVALID_CART_PRICE_MESSAGE.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
});

test("valid cart price snapshot is accepted", () => {
  assert.equal(validateCartPriceSnapshots([{ cartKey: "x", productId: "p1", qty: 1, priceAtAdd: 499 }]).valid, true);
});

test("cart merge rejects an invalid incoming price snapshot instead of writing zero", async () => {
  const { mergeGuestIntoAccount } = await import("../src/lib/cart/merge");
  assert.throws(() => mergeGuestIntoAccount([], [{ cartKey: "x", productId: "p1", qty: 1, priceAtAdd: 0 } as Parameters<typeof mergeGuestIntoAccount>[1][number]]), /Invalid cart price snapshot/);
});


test("cart merge API captures a positive server priceAtAdd and never trusts client price data", () => {
  const source = readFileSync("src/app/api/cart/route.ts", "utf8");
  assert.match(source, /const pricedIncoming: CartItem\[\] = incoming\.map/);
  assert.match(source, /priceAtAdd: selection\.price/);
  assert.match(source, /resolveAuthoritativeCartSelection\(product, item\.variantId\)/);
  const pricing = readFileSync("src/lib/cart/pricing.ts", "utf8");
  assert.match(pricing, /!Number\.isFinite\(price\) \|\| price <= 0/);
});

test("order creation contract uses HTTP 400 for invalid price snapshots", () => {
  const source = readFileSync("src/app/api/checkout/order/route.ts", "utf8");
  assert.match(source, /priceValidation\.valid/);
  assert.match(source, /NextResponse\.json\(\s*\{ error: priceValidation\.message \},\s*\{ status: 400 \}/);
});
