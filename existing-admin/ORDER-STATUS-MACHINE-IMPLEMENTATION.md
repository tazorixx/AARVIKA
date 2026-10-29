# P1.3 Order Status Machine

Implemented server-enforced order transitions while preserving existing payment and delivery flows.

## Normal lifecycle
- pending_payment -> confirmed (payment verification/webhook)
- confirmed -> processing
- processing -> packed
- packed -> shipped
- shipped -> out_for_delivery
- out_for_delivery -> delivered

## Exception states
- pending_payment -> payment_failed / expired / cancelled
- shipped -> delivery_failed / returned
- delivered -> returned / refunded
- returned -> refunded

## Safeguards
- Admin PATCH validates every status transition server-side.
- Shipment updates use the same transition validator instead of directly overwriting order status.
- Status history is appended for admin/shipment/refund transitions.
- Full refunds move the order to `refunded`; partial refunds retain the fulfillment status.
- Customer order status labels/timeline understand packed/out-for-delivery/delivery-failed/returned/refunded.

Existing payment confirmation remains `confirmed`, which is the current atomic state reached after verified Razorpay capture. This avoids changing the live payment processor's existing semantics while formalizing the fulfillment lifecycle after confirmation.
