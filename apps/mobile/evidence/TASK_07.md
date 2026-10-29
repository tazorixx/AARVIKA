# Task 07 — Anniversary and Hampers

Inspected Task 07, Anniversary image and original catalogue PDF pages 3–4, source child labels, shared bundle/cart/price logic and Task 06 report. Scoped mobile-only additive bundle metadata, pure price projection, demo sets, Anniversary/Hamper screens, shared PDP/card/builder/cart integration and tests. No environment/admin/production edits.

Anniversary exposes recipient/type, traditional 1/5/10/25/50-year labels plus arbitrary years, personalized/hamper/budget/interest/delivery/collection/all paths. Milestone materials are described as traditions, not guarantees. All ten exact Hamper families and child routes are reachable. Nine durable prebuilt family concepts use existing component SKUs; custom-family children open the builder. No synthetic hamper inventory. Builder persists recipient/occasion/budget/packaging/card message/components and rejects budget, stock, size/capacity and incompatibility errors. Cart combines component quantities against canonical stock. No food/fresh flowers introduced.

Verification: TypeScript/lint exit 0 after fixing conditional fixture type inference. Unit tests 23 passed. Full browser suite 12 passed in 21.9s. New tests prove arbitrary Anniversary year, prebuilt child -> customization -> budget failure/recovery -> component cart with recipient/occasion -> reload. Existing personalization, stock, wedding, env and shell checks pass. Screenshot task-07-hamper-cart-390.png.

Rollback: revert Task 07 checkpoint. Real delivery/returns, trusted price verification and persisted paid orders remain staging dependencies; sample sets are explicitly demos, not supplier listings. Native device QA outstanding. Available fixture verification passes. Next Task 08.
