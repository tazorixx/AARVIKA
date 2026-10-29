# Customer 360 Implementation

## Added
- Extended `/api/admin/customers/[customerId]` to aggregate profile, orders, saved addresses, reviews, support tickets, wishlist, coupon usage, and abandoned-cart state.
- Added Customer 360 dashboard UI at `/admin/customers/[customerId]`.
- Kept existing customer list/search/segmentation behavior unchanged.
- Uses existing Firestore collections and does not create duplicate customer records.
- Customer detail remains restricted to SUPER_ADMIN, ADMIN, and SUPPORT.

## Data sources
- users/{uid}
- users/{uid}/addresses
- orders where userId == uid
- reviews where userId == uid
- support_tickets where userId == uid
- wishlists/{uid}
- abandoned_carts/{uid}
- coupon usage derived from order.coupon

## Notes
This phase is read-only. No customer/order/payment mutation was added.
