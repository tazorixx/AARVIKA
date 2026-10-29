import test from "node:test";
import assert from "node:assert/strict";
import type { Product } from "../src/lib/catalog/types";
import { getDeliveryFee, isBeforeDeliveryCutoff } from "../src/lib/checkout/delivery-rules";

const product = { delivery: { minDays: 0, maxDays: 2, sameDay: true, fee: 49, slotFees: { "10 PM – 12 AM": 80 }, cutoffHour: 18 } } as Pick<Product, "delivery">;

test("delivery fee combines base and slot fee", () => {
  assert.equal(getDeliveryFee(product, "9 AM – 12 PM"), 49);
  assert.equal(getDeliveryFee(product, "10 PM – 12 AM"), 129);
});

test("same-day cutoff uses India time and allows future dates", () => {
  const now = new Date("2026-09-17T13:00:00.000Z"); // 18:30 IST
  assert.equal(isBeforeDeliveryCutoff(product, "2026-09-17", now), false);
  assert.equal(isBeforeDeliveryCutoff(product, "2026-09-18", now), true);
});
