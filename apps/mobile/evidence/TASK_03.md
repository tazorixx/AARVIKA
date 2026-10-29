# Task 03 — customer, wishlist and cart

Inspected: Task 03 and snapshot bearer-token/cart contracts. No safe staging credentials or service supplied, so local demo mode was used as authorized. No mock authentication is represented as secure authentication.

Changes: domain/cart.ts; state/store.tsx; customer-actions/cart-content components; account/wishlist/cart screens; root provider, header count and PDP integration; cart unit and customer browser tests. Typed persisted profiles isolate local wishlists/carts/addresses, serialize saves, merge guest cart, reject stock overflow and separate variant/customization lines. Explicit local-demo warnings prohibit entering real private details. Connection controls exercise normal/slow/failure. Failed saves keep previous state and surface retry guidance. Delivery check validates input but honestly reports unverified fulfilment. Checkout disabled.

Verification:
- `node node_modules/typescript/bin/tsc --noEmit`: exit 0.
- `node node_modules/eslint/bin/eslint.js .`: exit 0.
- `node --experimental-strip-types --test tests/*.test.ts`: 7 passed, 0 failed.
- `node node_modules/@playwright/test/cli.js test`: 3 passed. Customer case proves separate medium/large lines, wishlist, guest merge, reload persistence, address save, failure state and successful retry, profile re-entry; previous catalogue/shell cases pass.
- Screenshot task-03-cart-390.png captured. Responsive shell regression 320/390/768 retained.

Limits: demo profiles can be opened by anyone with the name on the same device. No trusted auth, cross-device sync, private server storage, real delivery or payable pricing. These remain staging dependencies, not production-ready features. No Firebase/admin/production interaction.

Rollback: revert Task 03 checkpoint; local storage namespace aarvika:demo:v1 can be cleared using the explicit account reset control. Next: Task 04 schema-driven personalization and bundles. Available verification gate passed; native QA outstanding.
