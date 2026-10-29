import test from "node:test";
import type { Firestore } from "firebase-admin/firestore";
type FakeTransaction = { get(ref: FakeRef): Promise<FakeSnapshot>; update(ref: FakeRef, values: Record<string, unknown>): void };
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { processRazorpayPaymentEvent } from "../src/lib/checkout/payment";
import { verifyRazorpayWebhookSignature } from "../src/lib/checkout/razorpay";
import { POST as razorpayWebhookPost } from "../src/app/api/checkout/razorpay/webhook/route";

type FakeRef = { path: string; id: string };
type FakeSnapshot = { exists: boolean; data: () => Record<string, unknown> | undefined; ref: FakeRef; id: string };

function makeFakeDb(initialOrder: Record<string, unknown>, initialInventory = { quantity: 10, reserved: 2, sold: 0 }) {
  const orderRef: FakeRef = { path: "orders/G4U-2609-00001", id: "G4U-2609-00001" };
  const productRef: FakeRef = { path: "products/p1", id: "p1" };
  const state = {
    order: { ...initialOrder },
    inventory: { ...initialInventory },
    updates: [] as Array<{ path: string; values: Record<string, unknown> }>,
  };

  const db = {
    runTransaction: async (callback: (tx: FakeTransaction) => Promise<unknown>) => {
      const tx = {
        get: async (ref: FakeRef): Promise<FakeSnapshot> => {
          if (ref.path === orderRef.path) {
            return { exists: true, data: () => state.order, ref: orderRef, id: orderRef.id };
          }
          return {
            exists: true,
            data: () => ({ status: "live", inventory: state.inventory }),
            ref: productRef,
            id: productRef.id,
          };
        },
        update: (ref: FakeRef, values: Record<string, unknown>) => {
          state.updates.push({ path: ref.path, values });
          if (ref.path === orderRef.path) {
            state.order = { ...state.order, ...values };
            if (values.payment && typeof values.payment === "object") {
              state.order.payment = values.payment;
            }
          }
          if (ref.path === productRef.path) {
            for (const [key, value] of Object.entries(values)) {
              const field = key.split(".").pop()!;
              state.inventory[field as keyof typeof state.inventory] = Number(value);
            }
          }
        },
      };
      return callback(tx);
    },
    collection: (name: string) => ({
      doc: (id: string) => ({ path: `${name}/${id}`, id }),
    }),
  } as unknown as Firestore;

  return { db, orderRef, state };
}

test("captured webhook atomically records payment and moves inventory to sold", async () => {
  const { db, orderRef, state } = makeFakeDb({
    userId: "user-1",
    status: "pending_payment",
    razorpayOrderId: "order_123",
    items: [{ productId: "p1", qty: 2, title: "Gift" }],
  });

  const result = await processRazorpayPaymentEvent({
    db,
    orderRef,
    eventId: "evt_1",
    paymentId: "pay_1",
    razorpayOrderId: "order_123",
    outcome: "captured",
  });

  assert.equal(result.kind, "processed");
  assert.equal(result.status, "confirmed");
  assert.equal(state.order.status, "confirmed");
  assert.deepEqual(state.order.payment, {
    provider: "razorpay",
    orderId: "order_123",
    paymentId: "pay_1",
    webhookEventId: "evt_1",
    status: "captured",
    paidAt: state.order.payment && typeof state.order.payment === "object" ? (state.order.payment as Record<string, unknown>).paidAt : undefined,
    updatedAt: (state.order.payment as Record<string, unknown>)?.updatedAt,
  });
  assert.equal(state.inventory.reserved, 0);
  assert.equal(state.inventory.sold, 2);
  assert.equal(state.inventory.quantity, 8);
});

test("duplicate webhook checks stored payment/event IDs and does not process twice", async () => {
  const { db, orderRef, state } = makeFakeDb({
    userId: "user-1",
    status: "confirmed",
    razorpayOrderId: "order_123",
    payment: { paymentId: "pay_1", webhookEventId: "evt_1", status: "captured" },
    items: [{ productId: "p1", qty: 2 }],
  }, { quantity: 8, reserved: 0, sold: 2 });

  const result = await processRazorpayPaymentEvent({
    db,
    orderRef,
    eventId: "evt_1",
    paymentId: "pay_1",
    razorpayOrderId: "order_123",
    outcome: "captured",
  });

  assert.equal(result.kind, "duplicate");
  assert.equal(state.inventory.reserved, 0);
  assert.equal(state.inventory.sold, 2);
  assert.equal(state.updates.length, 0);
});

test("a new webhook event with the same Razorpay payment ID is still idempotent", async () => {
  const { db, orderRef, state } = makeFakeDb({
    userId: "user-1",
    status: "confirmed",
    razorpayOrderId: "order_123",
    payment: { paymentId: "pay_1", webhookEventId: "evt_1", status: "captured" },
    items: [{ productId: "p1", qty: 2 }],
  }, { quantity: 8, reserved: 0, sold: 2 });

  const result = await processRazorpayPaymentEvent({
    db,
    orderRef,
    eventId: "evt_2",
    paymentId: "pay_1",
    razorpayOrderId: "order_123",
    outcome: "captured",
  });

  assert.equal(result.kind, "duplicate");
  assert.equal(state.inventory.sold, 2);
  assert.equal(state.updates.length, 0);
});

test("failed webhook releases reserved inventory and records failure", async () => {
  const { db, orderRef, state } = makeFakeDb({
    userId: "user-1",
    status: "pending_payment",
    razorpayOrderId: "order_123",
    items: [{ productId: "p1", qty: 2 }],
  });

  const result = await processRazorpayPaymentEvent({
    db,
    orderRef,
    eventId: "evt_fail",
    paymentId: "pay_fail",
    razorpayOrderId: "order_123",
    outcome: "failed",
    failureCode: "BAD_REQUEST_ERROR",
  });

  assert.equal(result.kind, "processed");
  assert.equal(result.status, "payment_failed");
  assert.equal(state.order.status, "payment_failed");
  assert.equal(state.inventory.reserved, 0);
  assert.equal(state.inventory.sold, 0);
  assert.equal(state.inventory.quantity, 10);
});

test("webhook route verifies the exact raw request body before JSON parsing", async () => {
  process.env.RAZORPAY_WEBHOOK_SECRET = "webhook-route-secret";
  const signedRawBody = '{"event":"payment.captured","payload": {"x":1}}';
  const signature = crypto.createHmac("sha256", "webhook-route-secret").update(signedRawBody).digest("hex");
  const reserializedBody = JSON.stringify(JSON.parse(signedRawBody));

  const response = await razorpayWebhookPost(new Request("https://example.test/api/checkout/razorpay/webhook", {
    method: "POST",
    headers: {
      "x-razorpay-signature": signature,
      "x-razorpay-event-id": "evt_raw_body",
      "content-type": "application/json",
    },
    body: reserializedBody,
  }));

  assert.equal(response.status, 400);
  assert.match(await response.text(), /Invalid Razorpay webhook signature/);
  delete process.env.RAZORPAY_WEBHOOK_SECRET;
});

test("webhook signature uses the exact raw body and separate webhook secret", () => {
  process.env.RAZORPAY_WEBHOOK_SECRET = "webhook-secret-test";
  const rawBody = '{"event":"payment.captured","payload": {"x":1}}';
  const signature = crypto.createHmac("sha256", "webhook-secret-test").update(rawBody).digest("hex");

  assert.equal(verifyRazorpayWebhookSignature({ rawBody, signature }), true);
  assert.equal(verifyRazorpayWebhookSignature({ rawBody: JSON.stringify(JSON.parse(rawBody)), signature }), false);

  delete process.env.RAZORPAY_WEBHOOK_SECRET;
});
