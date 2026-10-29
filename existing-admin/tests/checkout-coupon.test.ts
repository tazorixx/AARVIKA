import test from "node:test";
import assert from "node:assert/strict";
import { calculateCouponDiscount, normalizeCouponCode, parseCoupon } from "../src/lib/checkout/coupon";

test("coupon normalization is case-insensitive and bounded", () => {
  assert.equal(normalizeCouponCode("  save20 "), "SAVE20");
});

test("percent coupon applies and respects max discount", () => {
  const coupon = parseCoupon({ code: "SAVE20", active: true, type: "percent", value: 20, maxDiscount: 250 }, "SAVE20");
  assert.ok(coupon);
  const result = calculateCouponDiscount(coupon, 2000);
  assert.equal(result.valid, true);
  if (result.valid) assert.equal(result.discount, 250);
});

test("fixed coupon rejects carts below minimum subtotal", () => {
  const coupon = parseCoupon({ code: "FLAT500", active: true, type: "fixed", value: 500, minSubtotal: 3000 }, "FLAT500");
  assert.ok(coupon);
  const result = calculateCouponDiscount(coupon, 2500);
  assert.equal(result.valid, false);
});

test("expired and exhausted coupons are rejected", () => {
  const expired = parseCoupon({ active: true, type: "percent", value: 10, expiresAt: new Date(Date.now() - 1000) }, "OLD");
  assert.ok(expired);
  assert.equal(calculateCouponDiscount(expired, 1000).valid, false);
  const exhausted = parseCoupon({ active: true, type: "percent", value: 10, usageLimit: 5, usedCount: 5 }, "FULL");
  assert.ok(exhausted);
  assert.equal(calculateCouponDiscount(exhausted, 1000).valid, false);
});
