import test from "node:test";
import assert from "node:assert/strict";
import { canManageShipping, normalizeShipmentStatus, validateShipmentInput } from "../src/lib/admin/shipping";
import { readFileSync } from "node:fs";

test("shipping roles match fulfillment operators", () => {
  assert.equal(canManageShipping("SUPER_ADMIN"), true);
  assert.equal(canManageShipping("ADMIN"), true);
  assert.equal(canManageShipping("ORDER_MANAGER"), true);
  assert.equal(canManageShipping("SUPPORT"), false);
});

test("shipment statuses normalize and validate", () => {
  assert.equal(normalizeShipmentStatus(" IN_TRANSIT "), "in_transit");
  assert.equal(normalizeShipmentStatus("unknown"), null);
  assert.equal(validateShipmentInput({ courier: "BlueDart", trackingNumber: "BD123", status: "in_transit" }).valid, true);
  assert.equal(validateShipmentInput({ courier: "", trackingNumber: "BD123" }).valid, false);
  assert.equal(validateShipmentInput({ courier: "BlueDart", trackingNumber: "BD123", trackingUrl: "javascript:alert(1)" }).valid, false);
});

test("shipment endpoint is role protected and maps shipment status to order fulfillment", () => {
  const source = readFileSync("src/app/api/admin/orders/[orderId]/shipment/route.ts", "utf8");
  assert.match(source, /requireAdmin\(request, SHIPPING_ADMIN_ROLES\)/);
  assert.match(source, /tracking:/);
  assert.match(source, /shipmentToOrder/);
  assert.match(source, /isValidFulfillmentTransition/);
  assert.match(source, /update\.status = requestedOrderStatus/);
});
