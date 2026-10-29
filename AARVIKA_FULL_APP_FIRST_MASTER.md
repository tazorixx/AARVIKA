# AARVIKA — FULL CUSTOMER APP FIRST, ADMIN SECOND

**Owner-approved sequence update — 24 October 2026.** This document **supersedes the order** in the earlier AARVIKA Codex handoff. Preserve the earlier category references and audit as research; do not execute its admin-first tasks.

## 1. Goal and exact sequence

Build a **new**, beautifully designed, performant and **working** Android/iOS commerce app for ALL confirmed departments first. Do **not** stop after designing the homepage or after Wedding. Existing admin is not to be rewritten or changed during the customer-app phase; only read-only interoperability inspection is allowed. After all customer flows work on a safe staging backend, improve the existing admin and connect it. Then build the customer-facing website using the same catalogue/backend.

```text
0. Read-only existing repository/backend inspection; no admin changes
1. New Expo/React Native AARVIKA app + purple design system
2. Shared home, search, product catalogue, navigation and reusable shopping UI
3. All eight complete specialized department experiences
4. Personalization, gift boxes/combos, cart, checkout, orders and accounts
5. Staging backend integration + real end-to-end app QA
----------------------- APP READY GATE -----------------------
6. Update existing admin product/category/placement workflows
7. Connect admin publication -> live app data, verify in staging
8. Release app by approval; create responsive public website afterward
```

A functional **staging** app before admin may use a securely populated, **clearly demonstration-labelled** catalogue and read APIs. Fixture/seeding tools are temporary data-entry mechanisms, not a permanent replacement admin. App's visible purchase flow must only take real test-mode payments when safe server endpoints exist; simulated payment is clearly labelled. Complete app means real working interactions, persisted state, tested contract-driven backend and no dead buttons. Features that cannot actually transact (e.g., custom furniture without vendor quotes) must be implemented as a real inquiry flow, not a fake Buy Now.

## 2. All shopping departments (no exclusions)

Eight departments established in user's supplied category maps: **Wedding, Birthday, Personalized Gifts, Anniversary, Hampers, Clothing, Stationery and Furniture**. Owner wants nine total, but **the ninth has not been selected**. Implement a configurable inactive slot; don't silently create Festivals as a confirmed ninth department. Festival Hampers remain within Hampers. No eight-category screen should remain a nonfunctional Coming Soon shell at app-ready gate.

### 01 — Wedding
- By **religion/community**, state/region, specific tradition, event/function, product category, bride/groom/recipient, budget, gifting and full/function-wise combos. Never treat state and religion as interchangeable.
- Wedding path: Wedding → select community/tradition → state/region as useful → function → Ceremony Essentials / Fashion / Jewellery / Decorations / Gifts & Return Gifts / Custom Combos → PDP → cart.
- Include Marathi Sakharpuda/Halad/Antarpat; Gujarati Gol Dhana/Pithi/Garba/Mameru; Punjabi Sikh Anand Karaj vs Punjabi Hindu; Bengali Gaye Holud/Shubho Drishti; Tamil Oonjal; Telugu Jeelakarra Bellam/Talambralu; other reviewed regional and faith traditions, all as **optional, locally verified shopping templates**, not claims of universal religious requirements.
- Ceremony needs map to product **types** first and eligible canonical SKUs second. One item can appear in multiple traditions without duplicate stock. Optional ceremonies and family custom selections, event-date reminders, quantity rules with review, wedding registry/wishlist when ready, bulk gifts. Use the supplied wedding workbook and diagram for detailed cultures/functions and product lists.

### 02 — Birthday
- All reference axes: **Shop by Category, Recipient, Budget, Interest, Personalized Gifts, Gift Hampers & Combos, Birthday Milestones, Delivery Options, Trending Gifts, All Gifts**.
- Recipient/relationship, ages (first birthday, children, teens, 18/21/25/30/40/50/60/70/80 and arbitrary age), interests (books, tech, fashion, beauty, travel, plants, home etc.), configurable price bands, valid delivery availability, personalization and gifts. All filters can be combined; working product lists and category links.

### 03 — Personalized Gifts
- PDF families: **Personalized Drinkware, Stationery, Photo Gifts, Accessories, Home Décor, Wearables, Lifestyle Products, Jewellery, Create Your Own Combo**.
- Preserve source subtypes: mugs, bottles, tumblers, flasks; journals/notebooks/pens/planners/bookmarks; frames/albums/collages/prints; keychains/wallets/bags/phone cases/passport covers; name plates/cushions/lamps/wall décor/keepsakes; tees/hoodies/caps/totes; accessories/organisers; necklaces/bracelets/rings/engraving.
- Product-specific personalization schemas with name/text, photo/image upload, colour/font/layout, supported preview, validation and permissions. Customer custom combination from eligible products, no duplicate permanent SKU per combo.

### 04 — Anniversary
- All source axes: Shop by Category, Recipient, Anniversary Milestone, Personalized Gifts, Hampers & Combos, Budget, Interest, Delivery, Trending and All Anniversary Gifts.
- Year traditions 1st Paper, 5th Wood, 10th Tin/Aluminium, 25th Silver, 50th Gold plus any year; wife/husband/parents/couple/colleague where useful; couple gifts, engraving, romantic and practical gifts. Only verified delivery/offers.

### 05 — Hampers
- All **10 exact** source Level-2 families from PDF pages 3–4: **Birthday; Festival; Wedding & Engagement; Anniversary & Romantic; Corporate; Stationery; Self-Care & Lifestyle; Home & Décor; Baby & Kids; Custom Hampers**. Preserve their child categories verbatim from the source.
- Prebuilt hamper and Build Your Own flow: recipient/occasion/budget → compatible box → choose available items → quantities → customisation → packaging/card/message → actual price and availability → cart. Handle size/capacity/minimum/max constraints, incompatible products, stock loss and returns. Initial scope **nonperishable/durable** per PDF; food/flowers require separately approved logistics.

### 06 — Clothing
- All eight columns in supplied reference: **Men, Women, Kids, Shop by Clothing Type, Shop by Style, Shop by Occasion, Trending & Collections, Deals & Budget**. Include ethnic/casual/western, top/bottom, dresses, active, winter, undergarments and sleepwear, kids age groups, etc.
- Actual style, fabric, fit, age, colour, size, garment dimensions, style/occasion filters, size guides, variant-specific images and stock, offers with genuine verified conditions, selected outfit combos.

### 07 — Stationery
- All **11 exact** PDF families pages 5–6: **Notebooks & Diaries; Pens & Writing Supplies; School Stationery; Office Stationery; Planners & Calendars; Art & Craft Supplies; Aesthetic Stationery; Desk Accessories; Packaging & Gift Wrapping; Educational Supplies; Stationery Gift Sets**. Preserve child categories from PDF.
- Type-specific specs: size, sheet count, paper GSM, ruling, pen refill/ink/point, pack counts, grade/age, colour, art medium, quantity; appropriate gift sets/combos.

### 08 — Furniture
- All **9 Home** families: Living Room; Bedroom; Dining Room; Kitchen Furniture; Study & Home Office; Kids & Nursery; Storage & Utility; Outdoor & Balcony; Special & Space-Saving.
- All **9 Business/Commercial** families: Office & Corporate; Retail Shops; Restaurants & Cafés; Hotels & Hospitality; Salon, Spa & Beauty; Education & Library; Clinics & Healthcare; Warehouse & Workshop; Events & Venues. Preserve grouped subtypes from supplied furniture master image.
- Room/business/style/material/size/colour/budget filters; dimensions and measurement guide; configurations, room bundles, delivery/assembly; request-custom-design workflow with customer references/photos, dimensions, material, budget, estimate, status and vendor approval. If no vendor capability, custom furniture remains **inquiry-only**, not a made-up paid order.

### 09 — reserved (not yet approved)
- Dynamic hidden registry slot. Do NOT make up a live ninth department or prevent testing of the eight actual departments.

**Universal requirements for ALL eight:** complete navigation; appropriate subcategories; real listing filters; product detail; variant/SKU selection; wishlist; add to cart; account persistence; clear sold-out, error and empty states; per-product eligibility for personalization/combos; back/scroll/filter state restoration; accessible touch/keyboard/screen readers; working staging contract integration and test evidence. No invented ratings, stocks, prices or shipping promises.

## 3. Actual purple design and motion — applies to EVERY screen

Temporary brand `AARVIKA` editable in one config; primary Purple `#62298E`, dark Plum `#3E155C`, lavender `#E9DDF7`, pale lavender `#F7F0FF`, blush `#F4C6D9`, peach `#FFC5AF`, mint `#E6F5EF`, cream `#FFF1D9`, base `#FAF8FC`, white surfaces, high-contrast neutral text. Use tokenized spacing, type and images for mobile/web. **No AI-oversized text or giant cards**: section headings ~17–20sp, body ~14–16sp, product titles ~13–14sp, prices ~17–19sp, card padding ~8–12dp, mobile grid gap ~8–12dp, radii ~10–12dp. These are starting targets subject to actual-device and accessibility testing, not rigid overrides of large system fonts. On phones: typically 2 product columns, ~4 compact quick-category shortcuts where readable; adaptive tablet layout. All controls accessible with appropriately large hit areas (approximately 44 logical points or more for major actions), scalable text, safe areas.

**Global app shell**: five tabs Home / Categories / Offers / Wishlist / Account; consistent brand/search, cart in header, delivery/location if relevant, contextual product/detail header, right back behaviour; persistent filters when navigating back. Checkout and full-screen media/editor may hide tab bar. Search categories + products + gift occasions + wedding culture/ceremony names. Do not clone bottom navigation per department.

**Homepage from references**: compact banner/carousel; departments including all eight; Top Categories; bestsellers only from true data; category/occasion shortcuts; Build Your Own Combo CTA; Wedding cultures/functions; Birthday and Anniversary highlight collections; budget; promotions/offers; new arrivals; recently viewed optional. Dynamic typed section config: `id`, `type`, `title`, `dataSourceRef`, `order`, `enabled`, `responsivePresentation`, `action`, `scheduledDates` where applicable. Layout driven by versioned staging config now; admin GUI to reorder later. Never fabricate ratings, offers or delivery service.

**Shared reusable UI**: brand header; category shortcut; product card; campaign banner; price; genuine rating; image gallery; category breadcrumbs; variants; size chart; responsive filter/sort sheets; wishlist heart; cart counter; stock/delivery status; gift message; personalization form; combo steps; skeleton/empty/error; success confirmation. No clickless decoration. Reuse one `ProductCard`, not separate inconsistent styles for each department.

**Animation spec**: 120–200ms press feedback, 180–280ms sheets and filter interactions, 220–350ms screen transition, subtle carousel progress and add-to-cart confirmation; native/optimised drivers when supported; no continuous card animation while scrolling. Respect reduced-motion; avoid large page layout shifts. Test on small and mid-tier Android devices, iPhone if available.

## 4. Shared app and staging backend BEFORE admin changes

Suggested architecture (confirm actual repository): fresh Expo + React Native + TypeScript + Expo Router + Reanimated client; backend on a **separate staging Firebase project** or verified safe staging API, secure server functions for commerce, storage rules for user uploads; public website Next.js only later. If the existing backend already supports safe separation, adapters may be used, but do not modify existing admin routes in customer-app phase. Work in Git branches/worktrees with versioned feature checks.

**One canonical catalogue**. Three category levels per PDF: Main Category → Subcategory → Child Category → product, variant/SKU (product/SKU are not category levels). `department` can be root/category business module but don't add an unwanted fourth navigational level. Product to multiple collections/occasion/style/culture placements via relations, one actual inventory record per SKU. Recipients, budgets, culture, functions, age, milestones, room, style, delivery and sales are facets/collections, not rigid product-category paths.

**Typed contracts** must exist before department implementation: `Department`, `Category`, `Collection`, `Product`, `Variant/SKU`, `Inventory`, `FacetDefinition`, `SearchQuery`, `PersonalizationSchema`, `BundleTemplate`, `CustomBundle`, `WeddingTradition`, `Ceremony`, `CeremonyNeed`, `Cart`, `CartLine`, `Address`, `Order`, `PaymentStatus`, `DeliveryPolicy`, `QuoteRequest`, `PageLayout` and `Section`. Use adaptable API interfaces: `CatalogService`, `SearchService`, `CustomerService`, `MediaService`, `PersonalizationService`, `BundleService`, `CartService`, `CheckoutService`, `OrdersService`, `QuoteService`.

**Working without admin**: first implement local fixture adapters with honest demo tags; then import safe test SKUs and curated section config into **staging** via small idempotent seeding/migration tools; connect to actual staging API and verify all filters/cart/orders. Ensure changing to later admin-managed products requires **no change to app UI screens**; only backend data contents change. Never seed live product prices/ratings/orders from screenshot mockups.

**Checkout security**: server computes price/taxes/shipping/promotion eligibility; reserves stock/idempotent order creation; real payment gateway used only in test mode in staging, with server verification/webhooks; simulate failure/cancel/retry. Product types not purchasable without a vendor are inquiry-only. Account/cart restoration, multi-SKU variants, discounts, out-of-stock handling, partial failure and order tracking implemented and tested. Validate no secret/API credential in app bundle; upload privacy and moderation/retention for photos. Development fixture data must not be presented as published inventory.

## 5. Codex sequence — build the ENTIRE new app before touching admin

| Order | Task filename | Deliverable / go-no-go test |
|---|---|---|
| 00 | `00_READ_ONLY_DISCOVERY.md` | Inspect full repo and existing backend contracts; do not change admin or code |
| 01 | `01_SCAFFOLD_THEME_GLOBAL_SHELL.md` | Running Expo app, purple tokens, safe navigation, all 8 departments registered |
| 02 | `02_HOME_SHARED_DISCOVERY.md` | Compact homepage, working category links, dynamic layout fixture, search/filter/PLP/PDP basics |
| 03 | `03_AUTH_WISHLIST_CART.md` | Auth/account, persistent wishlist, SKU cart, addresses and errors |
| 04 | `04_PERSONALIZATION_COMBO_ENGINE.md` | Product-specific custom forms and cross-catalogue gift builder |
| 05 | `05_WEDDING_COMPLETE.md` | Full cultural/function path and Wedding catalogue/bundles |
| 06 | `06_BIRTHDAY_PERSONALIZED_COMPLETE.md` | Full Birthday + Personalized Gifts browse/operations; not just landing pages |
| 07 | `07_ANNIVERSARY_HAMPERS_COMPLETE.md` | Full Anniversary + Hampers, milestone and built-to-order combo flows |
| 08 | `08_CLOTHING_STATIONERY_COMPLETE.md` | All Clothing views/size/variants and 11 Stationery families/filter fields |
| 09 | `09_FURNITURE_COMPLETE.md` | 18 Furniture families, product details, room sets/custom inquiry |
| 10 | `10_STAGING_BACKEND_CHECKOUT_ORDERS.md` | Live-safe staging API, real order persistence, test payment, stock validation |
| 11 | `11_FULL_APP_QA_SIGNOFF.md` | All 8 category acceptance matrix and tested customer app ready gate |
| 12 | `12_EXISTING_ADMIN_AFTER_APP.md` | ONLY now start updating existing admin; simplify Add Product / taxonomy / placements |
| 13 | `13_ADMIN_APP_INTEGRATION.md` | Admin-created category/product/section appears in mobile via shared contracts |
| 14 | `14_WEBSITE_AFTER_APP_ADMIN.md` | Responsive new web store on shared backend after mobile/admin integration |

The tasks 03–09 may be reordered to reduce dependencies if Codex provides a grounded impact analysis, **but every feature must pass before Task 11 sign-off**. No early admin editing. Each task is a separate Codex session or branch with bounded changes and review. Follow task file + project `AGENTS.md`. Never give AI one single prompt to implement all fourteen tasks.

## 6. App-ready gate / definition of DONE

No screen counted complete based on screenshot alone. For every department: all reference shopping axes accessible; child categories and filter values accurate; compounded filters work and clear; PLP → SKU-aware PDP → wishlist/add to cart; specialized user interaction end-to-end (wedding ceremony selection, age milestone, photo personalization, anniversary years, hamper component editing, clothing sizes, stationery specifications or furniture quote); correct back/scroll/filter state; valid empty/errors; responsive compact UI, reduced motion; app can fetch real staging data through contracts, plus automated/manual QA evidence.

App-wide verification: auth/account/profile/address, search, offers without fake discounts, cart line variants and quantities, demo fixture replacement, backend-validated test checkout, order status, safe uploads, data rules, accessibility, small-screen/keyboard, loading/offline recovery, crash/performance, user privacy. All eight departments must be complete before admin redesign. Nine slot remains configurable and inactive unless owner confirms category. Features requiring non-existent vendors, fresh-food logistics or service fulfilment must be disabled/inquiry only and noted as launch dependencies.

## 7. Existing admin — after customer app gate, NOT BEFORE

At Task 12 only: re-audit full original Next.js project against `AARVIKA_13scripts_Admin_Audit.md` and current app contracts. Preserve existing authentication, roles, order/data history, upload code and positive UI. Revalidate partial-snapshot mismatches before fixing (editor vs parser variants `value/price`; personalized fields/maxCharacters/imageUpload; delivery settings; product publish requirements; hidden image-upload personalizations; 200-item filter cap; hardcoded homepage blocks/first six category rail). No assumptions that partial snapshot equals live deployment.

Implement a **five-step easy product wizard** (Basics/Images → Main/Sub/Child + collections → Prices/Variants/Stock → conditional personalization/combo/delivery → Preview/Draft/Publish). Category quick-create with breadcrumbs; no duplicate SKU records; homepage section CRUD, order, visibility, image, linked products/collections; per-department filter metadata; revision/audit, bulk import and error recovery. Preserve IDs and legacy links; migration dry-run, staging, rollback before any write to production. Full round-trip test: Admin new product → correct app home + category/occasion/culture + search → PDP/variants → cart → test checkout. The new app must not be rebuilt to accommodate Admin; Admin edits data matching predefined contracts.

## 8. Future website (after app + admin)

Next.js responsive web storefront sharing contracts and business data, desktop multi-column header/search and filter sidebar, compact grid, mobile filter sheets, proper SEO and deep links. Reuse design tokens and product business logic where practical, but create web-appropriate UI instead of a stretched phone screen. Use marketplace/Amazon scan as **research**, not copy of copyrighted branding, exact CSS, or proof of measurements.

## 9. Code delivery rules / report format

- No changes to production without explicit approval. No `.env` or customer data/secrets in commits or reports. Staging first; production only after separate authorization and verification.
- For every task Codex must read relevant sources and full repo, list files before changes, preserve existing features, produce testable scoped diff, run typecheck/lint/tests/build where available, actual device screenshots, and evidence for claims; record blockers honestly.
- Need full repo, not only uploaded `13scripts(1).zip`. UI references are design requirements, not finished code. Field claims from audit are source inspections, not proof of a live bug.
- Completion report: task, files edited, UX screenshots/screen recordings, tests executed + results, expected vs observed, affected environments, regressions, unresolved decisions and next task.

**First Codex message:**

```text
AARVIKA FULL APP FIRST — revised product-owner priority.
Read AGENTS.md, AARVIKA_FULL_APP_FIRST_MASTER.md, this bundle's source
references, and tasks/00_READ_ONLY_DISCOVERY.md.
Our task is to build a NEW, FULLY FUNCTIONAL Android/iOS app including ALL EIGHT
confirmed departments (Wedding, Birthday, Personalized Gifts, Anniversary,
Hampers, Clothing, Stationery, Furniture) BEFORE altering my existing admin.
Ninth department is not confirmed. Current task is read-only discovery:
inspect the complete repo and APIs, propose the new app workspace, staging
contracts, dependencies and implementation milestones. Do not edit files,
data, admin or deployments yet. Return a grounded report and STOP.
```
