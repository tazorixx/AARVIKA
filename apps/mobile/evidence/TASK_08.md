# Task 08 — Clothing and Stationery

Inspected Task 08, Clothing source image (all eight columns and grouped labels), original PDF pages 5–6, current taxonomy, SKU/cart/specification and Task 07 report. Scoped additive SKU artwork/size-guide contracts, source column/child metadata and demo apparel/stationery fixtures, reusable specification browser, PDP variant/measurement/return display, category routing and paginated shared discovery. No environment/admin/backend/schema changes.

Clothing has Men/Women/Kids/type/style/occasion/collection/budget entry paths; actual fixture fields drive size/colour/fabric/fit/age filters. Generated garments have independent SKU stock/prices and illustrative variant art; combined filters require one matching SKU. Guides show demo garment measurements and supplier-fit caveats. No invented promotions/rankings/sustainability guarantees. Stationery retains exact 11 source families/child groups, each with a demo example; paper size/GSM/sheets/ruling, pen ink/point/refill, packs, grade/age and art medium appear only where present. Product cards, PDP/cart and back state are shared. Pagination keeps larger catalogues reachable.

Verification: TypeScript/lint exit 0. 26 unit tests passed; 14 browser tests passed in 25.5s. New cases: clothing audience/size/colour -> variant artwork/guide -> M Blue SKU cart; paper A5/100 GSM -> journal; Gel Pens child -> ink/point specs. Unit tests reject sold-out XL/Blue and verify every Stationery child example. Existing 12 browser flows pass. Screenshots task-08-apparel-cart-390.png and task-08-stationery-390.png.

Rollback: revert Task 08 commit. Artwork/specifications are fixture concepts, not actual supplier photos, fit claims or safety certification. Native performance/font/keyboard/device QA and isolated staging remain outstanding. Available fixture verification passes. Next Task 09.

Final source-field review during Task 09 refined pencils/mechanical lead, highlighters/fountain pens and art media so they do not inherit unrelated ink/point or paper GSM fields. An additional unit case covers those distinctions; final regression totals are recorded in Task 09.
