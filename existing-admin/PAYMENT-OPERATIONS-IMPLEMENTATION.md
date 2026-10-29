# P1.2 — Payment Operations

Implemented on top of the existing Gift4U Razorpay integration.

## Added
- `Admin → Payments` screen with success/pending/failed/refunded filters.
- Payment summary metrics.
- Search by order, customer, phone, Razorpay order ID, or payment ID.
- Direct order links and Razorpay dashboard link.
- Server-side payment reconciliation against Razorpay.
- Reconciliation uses the existing atomic webhook payment processor for captured/failed states.
- Admin audit action `PAYMENT_RECONCILED`.
- Razorpay payment lookup helper.

## Safety decisions
- The browser never marks a payment successful.
- Reconciliation verifies the Razorpay payment against the Gift4U order's Razorpay order ID.
- Existing webhook signature verification remains unchanged.
- Existing refund endpoint remains the authoritative refund operation.
- Refund permissions remain restricted to `SUPER_ADMIN` and `ADMIN`.

## Not added yet
- Refund webhook reconciliation.
- Automatic settlement reconciliation.
- Payment CSV export.
- Chargeback/dispute operations.

Those belong after the core payment operations screen is validated.
