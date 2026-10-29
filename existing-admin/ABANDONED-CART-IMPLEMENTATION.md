# P2.2 Abandoned Cart Recovery

Implemented on top of the Search Management fixed build.

## Customer/cart tracking
- Account carts now carry `recoveryStatus` and `abandonedAt` metadata.
- Any cart mutation resets recovery status to `active` and clears `abandonedAt`.
- Empty carts are marked `empty`.
- Existing checkout cart clearing remains unchanged.

## Scheduled sweep
- `GET /api/cron/sweep-abandoned-carts`
- Protected by `CRON_SECRET` when configured.
- Flags carts with items that have been idle for more than 2 hours.
- Writes one `abandoned_carts/{userId}` recovery record.
- Captures customer identity, item snapshot and cart subtotal.
- Does not automatically message customers in this phase.

## Admin
- `Admin -> Sales & Fulfillment -> Abandoned Carts`
- Search/filter by customer and status.
- Flagged / Contacted / Recovered / Dismissed states.
- Mark contacted, recovered or dismissed.
- Admin changes are audited.

## Recovery attribution
- A verified Razorpay capture automatically marks an existing flagged/contacted abandoned cart as `recovered` and records the order ID.

## Deliberate scope
Automated email/WhatsApp recovery campaigns are not enabled yet. This phase establishes reliable detection, operational review and recovery attribution first.
