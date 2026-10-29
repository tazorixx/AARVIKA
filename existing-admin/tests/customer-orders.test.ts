import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  CUSTOMER_CANCELLABLE_ORDER_STATUSES,
  CUSTOMER_ORDER_STATUSES,
  CUSTOMER_TIMELINE_STEPS,
  getCustomerOrderStatusLabel,
  getTimelineProgress,
  isCustomerCancellableStatus,
  isCustomerOrderTerminal,
  normalizeCustomerOrderStatus,
} from "../src/lib/checkout/cancellation";

test("customer order status contract matches the implemented lifecycle", () => {
  assert.deepEqual(CUSTOMER_CANCELLABLE_ORDER_STATUSES, ["pending_payment"]);
  assert.deepEqual(CUSTOMER_ORDER_STATUSES, [
    "pending_payment",
    "payment_setup_failed",
    "payment_failed",
    "confirmed",
    "processing",
    "packed",
    "shipped",
    "out_for_delivery",
    "delivered",
    "delivery_failed",
    "returned",
    "expired",
    "cancelled",
    "refunded",
  ]);
});

test("customer status labels are stable and user-facing", () => {
  assert.equal(getCustomerOrderStatusLabel("pending_payment"), "Awaiting Payment");
  assert.equal(getCustomerOrderStatusLabel("confirmed"), "Confirmed");
  assert.equal(getCustomerOrderStatusLabel("processing"), "Preparing");
  assert.equal(getCustomerOrderStatusLabel("shipped"), "Shipped");
  assert.equal(getCustomerOrderStatusLabel("delivered"), "Delivered");
  assert.equal(getCustomerOrderStatusLabel("payment_failed"), "Payment Failed");
  assert.equal(getCustomerOrderStatusLabel("cancelled"), "Cancelled");
});

test("customer timeline progresses only through confirmed fulfillment states", () => {
  assert.equal(CUSTOMER_TIMELINE_STEPS.length, 7);
  assert.equal(getTimelineProgress("pending_payment"), 1);
  assert.equal(getTimelineProgress("confirmed"), 2);
  assert.equal(getTimelineProgress("processing"), 3);
  assert.equal(getTimelineProgress("shipped"), 5);
  assert.equal(getTimelineProgress("delivered"), 7);
  assert.equal(getTimelineProgress("cancelled"), 0);
});

test("only pending payment can be cancelled by the customer", () => {
  assert.equal(isCustomerCancellableStatus("pending_payment"), true);
  for (const status of CUSTOMER_ORDER_STATUSES.filter((status) => status !== "pending_payment")) {
    assert.equal(isCustomerCancellableStatus(status), false, status);
  }
});

test("terminal payment/cancellation states are distinct from fulfillment", () => {
  for (const status of ["payment_setup_failed", "payment_failed", "expired", "cancelled"]) {
    assert.equal(isCustomerOrderTerminal(status), true, status);
  }
  for (const status of ["confirmed", "processing", "shipped", "delivered"]) {
    assert.equal(isCustomerOrderTerminal(status), false, status);
  }
});

test("unknown status values never become an actionable customer state", () => {
  assert.equal(normalizeCustomerOrderStatus(" DISPATCHED "), null);
  assert.equal(normalizeCustomerOrderStatus("unknown"), null);
  assert.equal(normalizeCustomerOrderStatus(null), null);
  assert.equal(isCustomerCancellableStatus("dispatched"), false);
});

test("customer order APIs enforce ownership before returning order data", () => {
  const listSource = readFileSync("src/app/api/account/orders/route.ts", "utf8");
  const detailSource = readFileSync("src/app/api/account/orders/[orderId]/route.ts", "utf8");
  assert.match(listSource, /where\("userId", "==", uid\)/);
  assert.match(detailSource, /data\.userId !== uid/);
});

test("customer cancellation API rechecks the allowed state inside a transaction", () => {
  const source = readFileSync("src/app/api/checkout/cancel-order/route.ts", "utf8");
  assert.match(source, /cancelOrderTransactionally/);
  assert.match(source, /expectedUserId: uid/);
  const transaction = readFileSync("src/lib/checkout/cancel-order.ts", "utf8");
  assert.match(transaction, /db\.runTransaction/);
  assert.match(transaction, /isCustomerCancellableStatus\(status\)/);
  assert.match(transaction, /status: "cancelled"/);
  assert.match(transaction, /status: "cancelled"/);
});

test("customer order UI has no obsolete dispatched lifecycle state", () => {
  const listSource = readFileSync("src/app/orders/page.tsx", "utf8");
  const detailSource = readFileSync("src/app/orders/[orderId]/page.tsx", "utf8");
  assert.doesNotMatch(listSource, /case "dispatched"/);
  assert.doesNotMatch(detailSource, /\["dispatched"/);
});
