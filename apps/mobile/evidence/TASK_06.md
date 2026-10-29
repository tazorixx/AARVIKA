# Task 06 — Birthday and Personalized Gifts

Inspected Task 06, master/matrix/design, Birthday source map and original category PDF pages 7–10; current shared catalogue, schemas/cart and Task 05 completion record. Planned/changed mobile contracts, pure discovery predicate, fixture enrichment, reusable facet controls/GiftDiscovery, department/category routing, personalization preview and tests. Environment files/admin/Firebase unchanged.

Birthday now exposes all ten source paths and combines recipient/age/budget/interest/personalized selections. Arbitrary age validates 0–120. Delivery PIN checking explicitly returns unverified and verified-delivery filters return honest empty results. Trending is an unranked labelled demo collection. Personalized preserves nine exact source families and child labels; all product child paths have canonical demo examples; combo paths open the existing builder. Name/photo/engraving/wearable schemas validate independently, with persistent local drafts/cart. No actual order/payment is claimed.

Verification: TypeScript and lint exit 0. Unit suite 20 passed; full browser suite 10 passed. New browser cases: combined Birthday Her/Coffee/47 -> mug PDP; jewellery child -> engraving -> cart -> reload. Existing image, wedding, variant, network, environment and shell regressions pass. Screenshots task-06-birthday-390.png and task-06-engraving-cart-390.png.

Rollback: revert Task 06 checkpoint. Data contracts additive only. Fixture purchase totals remain previews; real auth/uploads/orders, vendor age-safety/delivery and native device QA remain Task 10/11 dependencies. Available verification passes; this is fixture implementation, not full staging release acceptance. Next Task 07.
