import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { canManageOrders, isValidFulfillmentTransition } from "../src/lib/admin/orders";
import { canManageRefunds, validateRefundRequest } from "../src/lib/admin/refunds";
import { canManageShipping, validateShipmentInput } from "../src/lib/admin/shipping";

test("P2 keeps order/refund/shipping roles separated", () => {
  assert.equal(canManageOrders("ORDER_MANAGER"), true);
  assert.equal(canManageRefunds("ORDER_MANAGER"), false);
  assert.equal(canManageShipping("ORDER_MANAGER"), true);
  assert.equal(canManageRefunds("ADMIN"), true);
});

test("P2 keeps fulfillment transitions sequential", () => {
  assert.equal(isValidFulfillmentTransition("confirmed", "processing"), true);
  assert.equal(isValidFulfillmentTransition("processing", "packed"), true);
  assert.equal(isValidFulfillmentTransition("packed", "shipped"), true);
  assert.equal(isValidFulfillmentTransition("processing", "shipped"), false);
  assert.equal(isValidFulfillmentTransition("shipped", "out_for_delivery"), true);
  assert.equal(isValidFulfillmentTransition("out_for_delivery", "delivered"), true);
  assert.equal(isValidFulfillmentTransition("shipped", "delivered"), false);
  assert.equal(isValidFulfillmentTransition("confirmed", "delivered"), false);
});

test("P2 validates refund ceiling", () => {
  const result = validateRefundRequest({ status: "processing", totals: { grandTotal: 1500 }, payment: { refundedAmount: 500 } }, 1000);
  assert.equal(result.valid, true);
  assert.equal(validateRefundRequest({ status: "processing", totals: { grandTotal: 1500 }, payment: { refundedAmount: 500 } }, 1001).valid, false);
});

test("P2 validates shipment URLs and required fields", () => {
  assert.equal(validateShipmentInput({ courier: "Courier", trackingNumber: "ABC123", trackingUrl: "https://example.com/ABC123", status: "in_transit" }).valid, true);
  assert.equal(validateShipmentInput({ courier: "", trackingNumber: "ABC123" }).valid, false);
  assert.equal(validateShipmentInput({ courier: "Courier", trackingNumber: "ABC123", trackingUrl: "javascript:alert(1)" }).valid, false);
});

test("P2 refund history endpoint is protected", () => {
  const source = readFileSync("src/app/api/admin/orders/[orderId]/refund/route.ts", "utf8");
  assert.match(source, /export async function GET/);
  assert.match(source, /collection\("refunds"\)/);
  assert.match(source, /requireAdmin\(request, REFUND_ADMIN_ROLES\)/);
});
