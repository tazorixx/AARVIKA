# Gift4U — Step 5 Customer Orders & Cancellation

## Scope

Customer order-history/detail experience and server-enforced cancellation-state handling.

## Created

- `src/lib/checkout/cancellation.ts`
- `tests/customer-cancellation.test.ts`

## Updated

- `src/app/orders/page.tsx`
- `src/app/orders/[orderId]/page.tsx`
- `src/app/api/checkout/cancel-order/route.ts`
- `package.json`

## Behavior

- Customer cancellation is explicitly configured for `pending_payment` only.
- The cancellation rule is enforced inside the server transaction, not just in the UI.
- Orders outside the configured cancellable state return HTTP 409 and cannot release inventory through the customer cancellation API.
- Missing orders return 404; another user's order returns 403.
- Pending-payment order detail exposes a Cancel order action and keeps the existing payment-processing flow intact.
- Customer order history now displays processing, shipped, delivered, payment-failed, expired, and cancelled states with dedicated badges.
- Confirmed order detail includes a customer-facing lifecycle timeline.
- Razorpay payment/webhook authority and inventory payment transitions are unchanged.

## Out of scope

- Refund API integration
- Courier integration
- Notifications
- Reviews
- Admin lifecycle expansion
- Catalog/payment architecture redesign
- `_archive/apps-web-phase0-reference/`

## Verification

Container-side verification could not run because the available copied `node_modules` contains incomplete package directories (notably `tsx`). The user's local verification must be run after applying this ZIP:

```powershell
npm run test:orders
npx tsc --noEmit
npm run build
npm run test:payment
npm run test:catalog
npm run test:rules
node --import tsx --test tests/cart-merge.test.ts tests/admin-orders.test.ts tests/cart.test.ts tests/checkout-delivery.test.ts tests/checkout-delivery-rules.test.ts tests/checkout-personalization.test.ts tests/checkout-coupon.test.ts
```

Do not mark Step 5 complete until those checks are clean.
