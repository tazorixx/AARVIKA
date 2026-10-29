import test from "node:test";
import assert from "node:assert/strict";
import { validateCouponInput } from "../src/lib/admin/coupons";

test("coupon validation normalizes code and accepts valid percentage", () => {
  const result = validateCouponInput({ code: " save10 ", type: "percent", value: 10 });
  assert.equal(result.ok, true); if (result.ok) assert.equal(result.value.code, "SAVE10");
});

test("coupon validation rejects invalid percentage and values", () => {
  assert.equal(validateCouponInput({ code: "BIG", type: "percent", value: 101 }).ok, false);
  assert.equal(validateCouponInput({ code: "ZERO", type: "fixed", value: 0 }).ok, false);
  assert.equal(validateCouponInput({ code: "BAD", type: "other", value: 10 }).ok, false);
});
