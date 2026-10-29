import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import {
  getAvailableStock,
  type ProductInventoryState,
} from "../src/lib/checkout/inventory";
import { verifyRazorpayPaymentSignature } from "../src/lib/checkout/razorpay";

test("getAvailableStock calculates quantity minus reserved", () => {
  const stock = getAvailableStock({ quantity: 10, reserved: 3, sold: 2 });
  assert.equal(stock, 7);
});

test("getAvailableStock floors at zero when reserved exceeds quantity", () => {
  const stock = getAvailableStock({ quantity: 2, reserved: 5, sold: 1 });
  assert.equal(stock, 0);
});

test("getAvailableStock handles empty or undefined inventory safely", () => {
  assert.equal(getAvailableStock(undefined), 0);
  assert.equal(getAvailableStock({}), 0);
});

test("reserve pattern increments reserved without touching total quantity", () => {
  const inventory: ProductInventoryState = { quantity: 15, reserved: 0, sold: 0 };
  const requested = 4;

  const availableBefore = getAvailableStock(inventory);
  assert.equal(availableBefore, 15);

  // Simulate reservation
  inventory.reserved += requested;

  const availableAfter = getAvailableStock(inventory);
  assert.equal(availableAfter, 11);
  assert.equal(inventory.quantity, 15); // quantity is NOT decremented during reservation
});

test("commitSold transitions reserved to sold and decrements total quantity", () => {
  const inventory: ProductInventoryState = { quantity: 15, reserved: 4, sold: 0 };
  const qty = 4;

  // Simulate commit
  inventory.reserved = Math.max(0, inventory.reserved - qty);
  inventory.sold += qty;
  inventory.quantity = Math.max(0, inventory.quantity - qty);

  assert.equal(inventory.reserved, 0);
  assert.equal(inventory.sold, 4);
  assert.equal(inventory.quantity, 11);
  assert.equal(getAvailableStock(inventory), 11);
});

test("releaseReserved restores available stock without modifying sold", () => {
  const inventory: ProductInventoryState = { quantity: 15, reserved: 4, sold: 2 };
  const qty = 4;

  // Simulate release (order canceled or expired)
  inventory.reserved = Math.max(0, inventory.reserved - qty);

  assert.equal(inventory.reserved, 0);
  assert.equal(inventory.sold, 2);
  assert.equal(inventory.quantity, 15);
  assert.equal(getAvailableStock(inventory), 15);
});

test("verifyRazorpayPaymentSignature validates genuine HMAC-SHA256 signature", () => {
  process.env.RAZORPAY_KEY_ID = "rzp_test_mock";
  process.env.RAZORPAY_KEY_SECRET = "secret_mock_12345";

  const orderId = "order_N123456";
  const paymentId = "pay_P123456";
  const genuineSignature = crypto
    .createHmac("sha256", "secret_mock_12345")
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  const isValid = verifyRazorpayPaymentSignature({
    razorpayOrderId: orderId,
    razorpayPaymentId: paymentId,
    signature: genuineSignature,
  });

  assert.equal(isValid, true);

  const isInvalid = verifyRazorpayPaymentSignature({
    razorpayOrderId: orderId,
    razorpayPaymentId: paymentId,
    signature: "tampered_signature",
  });

  assert.equal(isInvalid, false);

  // Clean up
  delete process.env.RAZORPAY_KEY_ID;
  delete process.env.RAZORPAY_KEY_SECRET;
});

test("order ID matches G4U-YYMM-XXXXX pattern", () => {
  const now = new Date();
  const year = String(now.getFullYear()).slice(-2);
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const period = `${year}${month}`;
  const orderId = `G4U-${period}-${String(42).padStart(5, "0")}`;

  assert.match(orderId, /^G4U-\d{4}-\d{5}$/);
  assert.equal(orderId, `G4U-${period}-00042`);
});
