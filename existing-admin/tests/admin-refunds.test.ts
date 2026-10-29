import test from "node:test";
import assert from "node:assert/strict";
import { canManageRefunds, getRefundableAmount, getRefundStatus, validateRefundRequest } from "../src/lib/admin/refunds";
import { readFileSync } from "node:fs";

test("refund roles are restricted to financial admins", () => {
  assert.equal(canManageRefunds("SUPER_ADMIN"), true);
  assert.equal(canManageRefunds("ADMIN"), true);
  assert.equal(canManageRefunds("ORDER_MANAGER"), false);
  assert.equal(canManageRefunds("CATALOG_MANAGER"), false);
});

test("refund amount respects already refunded value", () => {
  const order = { status: "processing", totals: { grandTotal: 1200 }, payment: { refundedAmount: 300 } };
  assert.equal(getRefundableAmount(order), 900);
  assert.equal(validateRefundRequest(order, 900).valid, true);
  assert.equal(validateRefundRequest(order, 901).valid, false);
});

test("refund status distinguishes none, partial and full", () => {
  assert.equal(getRefundStatus({ totals: { grandTotal: 1000 }, payment: {} }), "none");
  assert.equal(getRefundStatus({ totals: { grandTotal: 1000 }, payment: { refundedAmount: 250 } }), "partial");
  assert.equal(getRefundStatus({ totals: { grandTotal: 1000 }, payment: { refundedAmount: 1000 } }), "full");
});

test("refund endpoint is server protected and uses Razorpay payment id", () => {
  const source = readFileSync("src/app/api/admin/orders/[orderId]/refund/route.ts", "utf8");
  assert.match(source, /requireAdmin\(request, REFUND_ADMIN_ROLES\)/);
  assert.match(source, /payment\.paymentId/);
  assert.match(source, /createRazorpayRefund/);
  assert.match(source, /collection\("refunds"\)/);
  assert.match(source, /status === "processed"/);
});
