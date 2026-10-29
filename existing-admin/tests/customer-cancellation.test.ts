import test from "node:test";
import assert from "node:assert/strict";
import {
  CUSTOMER_CANCELLABLE_ORDER_STATUSES,
  isCustomerCancellableStatus,
} from "../src/lib/checkout/cancellation";

test("customer cancellation is enabled only for the configured pending-payment state", () => {
  assert.deepEqual(CUSTOMER_CANCELLABLE_ORDER_STATUSES, ["pending_payment"]);
  assert.equal(isCustomerCancellableStatus("pending_payment"), true);
  assert.equal(isCustomerCancellableStatus("PENDING_PAYMENT"), true);
});

test("customer cancellation is rejected after payment or fulfillment advances", () => {
  for (const status of [
    "confirmed",
    "processing",
    "shipped",
    "delivered",
    "payment_failed",
    "expired",
    "cancelled",
    "payment_setup_failed",
  ]) {
    assert.equal(isCustomerCancellableStatus(status), false, status);
  }
});

test("unknown and malformed statuses are not cancellable", () => {
  assert.equal(isCustomerCancellableStatus(""), false);
  assert.equal(isCustomerCancellableStatus(undefined), false);
  assert.equal(isCustomerCancellableStatus(null), false);
  assert.equal(isCustomerCancellableStatus(123), false);
});
