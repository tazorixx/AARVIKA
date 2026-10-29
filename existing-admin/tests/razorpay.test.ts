import test from "node:test";
import assert from "node:assert/strict";
import { createRazorpayOrder, verifyRazorpayPaymentSignature } from "../src/lib/checkout/razorpay";

function withoutRazorpayKeys() {
  const original = {
    nodeEnv: process.env.NODE_ENV,
    keyId: process.env.RAZORPAY_KEY_ID,
    publicKeyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    keySecret: process.env.RAZORPAY_KEY_SECRET,
  };

  delete process.env.RAZORPAY_KEY_ID;
  delete process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  delete process.env.RAZORPAY_KEY_SECRET;

  return () => {
    if (original.nodeEnv === undefined) Reflect.deleteProperty(process.env, "NODE_ENV");
    else (process.env as Record<string, string | undefined>).NODE_ENV = original.nodeEnv;

    if (original.keyId === undefined) delete process.env.RAZORPAY_KEY_ID;
    else process.env.RAZORPAY_KEY_ID = original.keyId;

    if (original.publicKeyId === undefined) delete process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    else process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID = original.publicKeyId;

    if (original.keySecret === undefined) delete process.env.RAZORPAY_KEY_SECRET;
    else process.env.RAZORPAY_KEY_SECRET = original.keySecret;
  };
}

test("production Razorpay order creation rejects when credentials are missing", async () => {
  const restore = withoutRazorpayKeys();
  (process.env as Record<string, string | undefined>).NODE_ENV = "production";

  try {
    await assert.rejects(
      createRazorpayOrder({
        amountInPaise: 49900,
        currency: "INR",
        receipt: "G4U-TEST-PROD-MISSING-RAZORPAY",
      }),
      (error: unknown) => {
        assert.ok(error instanceof Error);
        assert.equal(
          error.message,
          "Razorpay is not configured. Payment cannot be initiated in this environment.",
        );
        return true;
      },
    );
  } finally {
    restore();
  }
});

test("production Razorpay signature verification rejects when credentials are missing", () => {
  const restore = withoutRazorpayKeys();
  (process.env as Record<string, string | undefined>).NODE_ENV = "production";

  try {
    assert.equal(
      verifyRazorpayPaymentSignature({
        razorpayOrderId: "rzp_mock_should_not_be_accepted",
        razorpayPaymentId: "pay_test",
        signature: "mock_signature_approved",
      }),
      false,
    );
  } finally {
    restore();
  }
});
