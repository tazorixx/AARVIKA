import test from "node:test";
import assert from "node:assert/strict";
import { validateCouponInput } from "../src/lib/admin/coupons";
import { validateHomepageInput } from "../src/lib/admin/homepage";

test("coupon validation rejects percentage above 100", () => { const result = validateCouponInput({ code: "SAVE100", type: "percent", value: 101 }); assert.equal(result.ok, false); });
test("coupon validation accepts scheduled coupon", () => { const result = validateCouponInput({ code: "SAVE10", type: "percent", value: 10, startsAt: "2026-09-21T10:00:00Z", expiresAt: "2026-09-30T10:00:00Z" }); assert.equal(result.ok, true); });
test("homepage validation rejects invalid type", () => { const result = validateHomepageInput({ type: "video" }); assert.equal(result.valid, false); });
test("homepage validation accepts banner", () => { const result = validateHomepageInput({ type: "banner", title: "Birthday gifts" }); assert.equal(result.valid, true); });
