# Gift4U Step 4 — Payment & Razorpay Completion

## Scope
- Added Razorpay webhook endpoint with raw-body HMAC verification.
- Added separate `RAZORPAY_WEBHOOK_SECRET` verification.
- Added atomic payment-event processing with Firestore transaction idempotency using both Razorpay payment ID and webhook event ID stored on the order payment object.
- Added captured-payment inventory transition: reserved -> sold.
- Added failed-payment inventory transition: reserved -> available.
- Added cleanup when Razorpay order creation fails after inventory reservation.
- Restricted browser payment verification endpoint to development-only mock/test flow; production payment authority is the webhook.
- Updated checkout browser flow to redirect to a processing state after Razorpay success callback instead of treating the browser callback as authoritative.
- Added automatic order-detail polling and explicit pending/failed/expired/cancelled payment states.
- Added payment regression tests, including duplicate payment/event handling and raw-body signature behavior.
- Added `npm run test:payment` convenience script.

## Files
CREATE
- `src/lib/checkout/payment.ts`
- `src/app/api/checkout/razorpay/webhook/route.ts`
- `tests/checkout-payment.test.ts`

UPDATE
- `src/lib/checkout/razorpay.ts`
- `src/app/api/checkout/order/route.ts`
- `src/app/api/checkout/verify-payment/route.ts`
- `src/app/checkout/page.tsx`
- `src/app/orders/[orderId]/page.tsx`
- `package.json`

DELETE
- none

## Verification limitation
The implementation was inspected for cross-file consistency, but this container could not execute the project TypeScript/build tests because its copied `node_modules` lacked the installed package contents and offline package installation was not cached. Local verification is required before Step 4 is marked complete.
