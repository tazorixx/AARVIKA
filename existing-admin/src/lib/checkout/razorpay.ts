import crypto from "node:crypto";

export interface RazorpayOrderResponse {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
  keyId: string;
  mock?: boolean;
}

export function getRazorpayKeys() {
  const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "";
  const keySecret = process.env.RAZORPAY_KEY_SECRET || "";
  return { keyId, keySecret, isConfigured: Boolean(keyId && keySecret) };
}

/**
 * Creates an order with Razorpay via standard HTTPS API (no heavy SDK dependency).
 * Falls back to an emulator/test mock order if credentials are not configured locally.
 */
export async function createRazorpayOrder({
  amountInPaise,
  currency = "INR",
  receipt,
  notes = {},
}: {
  amountInPaise: number;
  currency?: string;
  receipt: string;
  notes?: Record<string, string>;
}): Promise<RazorpayOrderResponse> {
  const { keyId, keySecret, isConfigured } = getRazorpayKeys();

  if (!isConfigured) {
    if (process.env.NODE_ENV !== "development") {
      throw new Error("Razorpay is not configured. Payment cannot be initiated in this environment.");
    }
    // Development-only mock when Razorpay keys are not yet configured.
    const mockId = `rzp_mock_${receipt.replace(/[^a-zA-Z0-9]/g, "")}_${Date.now()}`;
    return {
      id: mockId,
      amount: amountInPaise,
      currency,
      receipt,
      keyId: keyId || "rzp_test_placeholder",
      mock: true,
    };
  }

  const authHeader = `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`;

  const response = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: Math.round(amountInPaise),
      currency,
      receipt,
      notes,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Razorpay order creation failed (${response.status}): ${errorText}`);
  }

  const data = (await response.json()) as { id: string; amount: number; currency: string; receipt: string };

  return {
    id: data.id,
    amount: data.amount,
    currency: data.currency,
    receipt: data.receipt,
    keyId,
  };
}

export function getRazorpayWebhookSecret(): string {
  return process.env.RAZORPAY_WEBHOOK_SECRET || "";
}

/**
 * Verifies Razorpay's X-Razorpay-Signature against the exact raw webhook body.
 * The webhook secret is intentionally separate from RAZORPAY_KEY_SECRET.
 */
export function verifyRazorpayWebhookSignature({
  rawBody,
  signature,
}: {
  rawBody: string;
  signature: string;
}): boolean {
  const webhookSecret = getRazorpayWebhookSecret();
  if (!webhookSecret || !signature) return false;

  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(rawBody)
    .digest("hex");

  const expectedBuffer = Buffer.from(expectedSignature, "utf-8");
  const signatureBuffer = Buffer.from(signature, "utf-8");
  if (expectedBuffer.length !== signatureBuffer.length) return false;
  return crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
}

/**
 * Verifies the Razorpay payment signature cryptographically using HMAC SHA-256.
 */
export function verifyRazorpayPaymentSignature({
  razorpayOrderId,
  razorpayPaymentId,
  signature,
}: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  signature: string;
}): boolean {
  const { keySecret, isConfigured } = getRazorpayKeys();

  if (!isConfigured) {
    if (process.env.NODE_ENV !== "development") return false;
    // In local development mock mode, accept mock signature pattern
    return razorpayOrderId.startsWith("rzp_mock_") && signature === "mock_signature_approved";
  }

  const expectedSignature = crypto
    .createHmac("sha256", keySecret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");

  const expectedBuffer = Buffer.from(expectedSignature, "utf-8");
  const signatureBuffer = Buffer.from(signature, "utf-8");

  if (expectedBuffer.length !== signatureBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
}


export interface RazorpayPaymentResponse {
  id: string;
  orderId?: string;
  amount: number;
  currency: string;
  status: string;
  captured?: boolean;
  method?: string;
  errorCode?: string;
  errorDescription?: string;
}

export async function fetchRazorpayPayment(paymentId: string): Promise<RazorpayPaymentResponse> {
  const { keyId, keySecret, isConfigured } = getRazorpayKeys();
  if (!isConfigured) {
    throw new Error("Razorpay is not configured.");
  }
  if (!paymentId) throw new Error("Payment ID is required.");

  const response = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}`, {
    headers: { Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}` },
    cache: "no-store",
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Razorpay payment lookup failed (${response.status}): ${errorText}`);
  }
  const data = (await response.json()) as Record<string, unknown>;
  return {
    id: String(data.id || paymentId),
    orderId: typeof data.order_id === "string" ? data.order_id : undefined,
    amount: Number(data.amount || 0),
    currency: String(data.currency || "INR"),
    status: String(data.status || "unknown"),
    captured: typeof data.captured === "boolean" ? data.captured : undefined,
    method: typeof data.method === "string" ? data.method : undefined,
    errorCode: typeof data.error_code === "string" ? data.error_code : undefined,
    errorDescription: typeof data.error_description === "string" ? data.error_description : undefined,
  };
}

export interface RazorpayRefundResponse {
  id: string;
  amount: number;
  currency: string;
  paymentId: string;
  status?: string;
}

export async function createRazorpayRefund({
  paymentId,
  amountInPaise,
  notes = {},
  idempotencyKey,
}: {
  paymentId: string;
  amountInPaise: number;
  notes?: Record<string, string>;
  idempotencyKey?: string;
}): Promise<RazorpayRefundResponse> {
  const { keyId, keySecret, isConfigured } = getRazorpayKeys();
  if (!isConfigured) {
    if (process.env.NODE_ENV !== "development") {
      throw new Error("Razorpay is not configured. Refund cannot be processed in this environment.");
    }
    return {
      id: `rfnd_mock_${paymentId}_${Date.now()}`,
      amount: amountInPaise,
      currency: "INR",
      paymentId,
      status: "processed",
    };
  }

  if (!paymentId || !Number.isFinite(amountInPaise) || amountInPaise <= 0) {
    throw new Error("Invalid Razorpay refund request.");
  }

  const headers: Record<string, string> = {
    Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
    "Content-Type": "application/json",
  };
  if (idempotencyKey) headers["X-Razorpay-Idempotency"] = idempotencyKey;

  const response = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}/refund`, {
    method: "POST",
    headers,
    body: JSON.stringify({ amount: Math.round(amountInPaise), notes }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Razorpay refund failed (${response.status}): ${errorText}`);
  }

  const data = (await response.json()) as { id: string; amount: number; currency: string; payment_id?: string; status?: string };
  return {
    id: data.id,
    amount: data.amount,
    currency: data.currency,
    paymentId: data.payment_id || paymentId,
    status: data.status,
  };
}
