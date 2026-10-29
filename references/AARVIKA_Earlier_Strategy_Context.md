# AARVIKA — App-First Commerce Master Plan
**Status:** Development planning v1  |  **Date:** 23 October 2026  |  **Brand:** AARVIKA (temporary)

## Executive direction
Create one polished mobile commerce app with nine prominent shopping entry points, a shared product master, occasion-aware collections, editable gifting combos, and reliable payments and fulfilment. Ship mobile before the customer website. Run a small admin interface as part of mobile development because products, categories and orders must be maintained. A later Next.js storefront should use the same account, product, SKU, cart, order and admin APIs.

## Source-backed departments and ninth-category proposal
Eight departments are established by supplied reference maps: **Wedding, Birthday, Anniversary, Clothing, Furniture, Hampers, Stationery, Personalised Gifts**. The ninth is not identified by the files. **Festivals & Celebrations** is a proposal only and must be confirmed or replaced by the owner.

| Department | Source-driven browse pillars / product families |
|---|---|
| Wedding | Religion/community, state/region, ceremony, function products, ritual essentials, apparel, gifts, customizable combos. Traditions are optional, family-confirmed templates. |
| Birthday | Product category, recipient, budget, interest, personalized gifts, hampers/combos, milestones, trending, all; delivery as universal filter. One supplied diagram also gives delivery a dedicated pillar. |
| Anniversary | Product category, recipient, milestone, personalized gifts, hampers, budget, interests, delivery, trends, all. |
| Clothing | Men, Women, Kids, Type, Style, Occasion, Trends, Deals/Budget. Men: topwear, bottomwear, ethnic, activewear, innerwear. Women: tops, dresses, bottomwear, ethnic, co-ords, winterwear, innerwear/sleepwear. Kids: age, boys, girls, infants. |
| Furniture | Home: living, bedroom, dining, kitchen, study, kids/nursery, storage, outdoor/balcony, special/space-saving. Business: offices, retail, restaurants/cafes, hotels, salons, education, clinics, warehouses, events. Plus room/material/budget/customization filters. |
| Hampers | 10 families: birthday, festivals, wedding/engagement, anniversary/romantic, corporate, stationery, self-care, home/decor, baby/kids, custom. |
| Stationery | 11 families: notebooks/diaries, writing supplies, school, office, planners, art/craft, aesthetic, desk, packaging/gift wrapping, educational, gift sets. |
| Personalised Gifts | 9 families: drinkware, stationery, photo gifts, accessories, home decor, wearables, lifestyle, jewellery, create-your-own combos. |
| Festivals & Celebrations* | Proposed: select festival, family custom, recipient, gifts, decorations, apparel, personalized products, budget, bundles. |

\*Not sourced to an uploaded category diagram.

## Important reconciliation decisions
1. Preserve the PDF's three-level canonical merchandise hierarchy: Main Category > Subcategory > Child Category. Products/SKUs are distinct from navigation-only occasion collections.
2. The supplied PDF excludes perishables in its initial scope, while the Birthday/Anniversary concept images contain chocolates, gourmet hampers, cakes or fresh flowers. Launch non-perishables only; treat short-life goods as a gated future assortment requiring specialist partners, handling, delivery and cancellation rules.
3. Do not fabricate product prices, ratings, inventory, delivery dates or sellers while building prototype UI; clearly tag internal demo content.
4. Every SKU exists once and may be visible in multiple occasion, recipient, state or ceremony collections. No copies of SKU documents per landing page.
5. Combos contain product selections, quantities, options and packaging, not a permanent SKU for every possible combination.
6. Cultural and religious practices vary by community and family. Ritual requirements must be reviewed and adjustable, never presented as automatically mandatory.

## Release order — activate two departments at a time after Wedding
- **Wave 0:** Architecture, admin, animation design, checkout foundations supporting all nine departments.
- **Wave 1:** Wedding end-to-end, including by culture/state/function and ceremony product bundles.
- **Wave 2:** Birthday + Personalised Gifts. High overlap with gifts and wedding bundle engine.
- **Wave 3:** Anniversary + Hampers. Reuse milestone and custom bundle flows.
- **Wave 4:** Clothing + Stationery. Add clothing-specific variants and editorial collections, and stationery/packaging facets.
- **Wave 5:** Furniture + Proposed Festivals. Handle bulky-item logistics/quotes separately and activate approved ninth category.
- **Wave 6:** Public website after mobile experience has been validated, reusing one backend and the same logical inventory.

A wave is released only when its acceptance checklist passes; no date or claim of immediate delivery is assumed.

## Storefront architecture
Keep nine visible shopping departments but separate their data from the product master:

    AARVIKA
      Home / Search / Browse Departments / Customise / Cart / Account
      Discovery Hubs: Wedding | Birthday | Personalised | Anniversary | Hampers | Clothing | Stationery | Furniture | Ninth
      Collections: occasion / recipient / milestone / culture / state / ceremony / trend / budget
      Canonical Products: departments > subcategories > child categories > product > SKU variants
      Commerce: pricing / stock / cart / checkout / orders / return / payments
      Operations: admin / role-based access / fulfilment / shipping eligibility / editorial assets

Use a single PDP for the same product wherever it is found. Use one filtering engine that loads facet definitions by department (size/fit for clothing; material and dimensions for furniture; ages/relationship for gifts; name/photo/message fields for personalized products; cultural review for ceremonies).

## Mobile UX — first design targets
**Home:** temporary AARVIKA mark, search, location/PIN check, tasteful editorial hero, the nine entry points in a compact scrollable grid/rail, occasion cards, curated products, quick discovery, and recently viewed; no excessive card walls.

**Bottom navigation:** Home / Explore / Customise / Cart / Account. Wishlist heart can live in the top bar and product cards. Guests can browse before signing in. Cart persists through login.

**Wedding landing:** horizontal cards for By Culture / By State / By Function / Shop Everything; optional wedding guide and bundle builder; verified tradition content.

**Birthday landing:** recipient quick chips, budgets, interests, personalized gift collections, milestone cards, featured products and delivery-eligibility facets.

**Anniversary:** milestones 1/5/10/25/50 plus custom years; relationship filters; elegant product edits, couple gifts, gift boxes and personalization.

**Clothing:** editorial photography, Men/Women/Kids entry points, type/style/occasion filters, fit and sizing, wishlist and seasonal edits.

**Furniture:** room-specific image browsing, dimensions and material filters, specifications, delivery assembly service by location; separate quotation and bespoke request.

**PDP:** multi-image gallery, title, seller, actual verified rating only, variant and price, personalization inputs if supported, PIN serviceability, accurate dispatch estimate, return/warranty, add-to-cart sticky CTA.

**Combo builder:** choose occasion or start empty > choose eligible SKU variants > quantities > supported personalization > packaging > price summary > add to cart. Warn if selected items ship separately.

## Design language / animation-first requirement
Temporary palette: Deep Plum #351750, Violet #7044AE, Warm Ivory #FBF8F5, Blush #F2DDE8, Muted Gold #C8A668, Ink #241D29. Use a neutral product photography background and accessible text contrast. Typography: clean sans-serif for UI; optional limited editorial serif for celebrations. Use moderate radii, subtle borders, whitespace, and asymmetrical editorial blocks rather than repeating multicolor dashboard cards.

**Motion principles:** functional, performant, subtle, meaningful, optional for motion-sensitive users. Motion design approval precedes full UI feature construction. Suggested timings are design starting points, not rigid requirements:
- Category press 100–180 ms with gentle scale; route transition 220–320 ms.
- Hero fade 350–500 ms; product entrance 180–260 ms once, no repeated feed animation.
- Wishlist heart 160–220 ms with haptic optional; Add-to-Cart confirmation 220–350 ms.
- Filter bottom sheet 220–320 ms; combo step transition 220–300 ms.
- Payment success animation only **after server verification**; the success state must remain legible without animation.
- Device reduce-motion settings disable decorative animations; no motion should delay shopping.
- Prototype on entry/midrange Android as well as high-end devices; favor transform and opacity over expensive layout/shadow animation.

Recommended implementation: React Native + Expo + Expo Router, with React Native Reanimated; optional light Lottie/Rive illustrations only where technically compatible. Use image caching and lazy loading, not large looping hero videos on every screen.

## Backend architecture for app-first and web-later
Preferred: TypeScript monorepo with packages for design tokens, business types, data contracts, commerce calculation, API client and shared validation schemas. Mobile app uses Expo. Web storefront later uses Next.js for SEO and website-specific composition. Admin starts as a minimal secure web console.

Firebase can support Auth, Firestore, Storage, Functions/Cloud Run, Crashlytics, Analytics and Remote Config, with security rules and App Check. Use server-side code for inventory changes, checkout totals, discounts, payment initiation and verification; no sensitive keys in the mobile app. For complex ecommerce search/filter scale, evaluate a dedicated search service and maintain a sync index.

Minimal logical entities:
- `departments`, `categories` (3 levels), `collections`, `collection_links`, `facets`, `facet_values`
- `product_types`, `products`, `product_variants`, `sku_stock`, `sellers`, `media_assets`
- `traditions`, `ceremonies`, `tradition_ceremonies`, `ceremony_needs`, `product_eligibility`
- `bundle_templates`, `bundle_components`, `customer_bundles`, `customer_bundle_lines`
- `users`, `addresses`, `wishlists`, `carts`, `cart_lines`, `orders`, `order_lines`
- `payments`, `refunds`, `inventory_reservations`, `fulfilments`, `shipment_events`, `returns`
- `personalization_templates`, `personalization_requests`, `personalization_previews`

Inventory must remain SKU-based. Checkout creates a server-priced immutable order snapshot, reserves stock atomically, initiates the gateway order, validates payment signatures and webhook idempotency, then transitions fulfilment. Never accept a mobile-provided amount or stock flag as authoritative.

## Admin / operations
Admin controls: nine hub visibility; three-level category CRUD; slugs and display order; collection placement; product types and dynamic specs; SKUs/variants/stock; promo banners; cultural review sources; optional rites; combo eligibility and price rules; personalized photo/text options; order and refund lifecycle; delivery zones; discount campaigns; customer support; roles and audit logs.

Use publication states `draft -> review -> active -> archived`; preview draft in admin before activation. Hide or label empty collections by explicit storefront policy. Keep all product image uploads access-controlled. Support seller/warehouse expansion later, not in the first single-retailer release unless essential.

## Payment, law, shipping and customer trust
Use a payment gateway suitable for physical goods in India; confirm current React Native compatibility and test builds. Android Google Play billing and Apple IAP generally do **not** apply to ordinary physical goods; a future digital goods/in-app content business may have different rules.

India's Consumer Protection (E-Commerce) Amendment Rules 2026 are scheduled to take effect on 1 January 2027. Product, prior-price, sponsored-listing and grievance transparency must be part of design reviews, not added after launch. Ask Indian counsel to review applicable entity obligations. Do not show fake discounts, fake reviews, fabricated delivery slots or inflated popularity badges. Use explicit consent for personalized uploads and give users deletion controls according to applicable law and retention policy.

For physical delivery: PIN serviceability and lead times per SKU; bulky furniture with special routing; gifts may need recipient address separate from purchaser; configurable gift note; items in one combo may create multiple packages with truthful delivery promises.

## How multiple developers should work together
- One product owner owns nine-category registry and decisions (especially ninth category and perishables).
- One UI/motion owner controls design tokens, component library, navigation and interactions.
- One backend/admin owner controls data contracts, rules, inventory, payment states and admin.
- Category contributors own reviewable *data seed files* and page configuration, not copies of the app shell.
- One QA/release owner manages automated/manual tests, performance, device matrix and acceptance signoff.

Workflow: design decision > brief/task ID > contract/schema review > branch > code review > staging build > acceptance tests > merge > tagged release. Avoid multiple AI-assisted developers editing the same navigation, shared types or auth/payment code simultaneously. CI must check formatting, types, lint, tests and migrations. Protect API contracts with versioning.

## Acceptance tests — examples
1. Same product listed in Wedding, Birthday and Personalised has one ID, one stock quantity and one PDP URL pattern.
2. Deactivating a category hides it from the app without deleting associated products.
3. Wedding culture selections never mark optional traditions as mandatory.
4. Personalisation fields display only when a selected SKU supports them; order holds the exact values.
5. The user changes combo item quantity; price changes immediately, then is verified again at checkout.
6. Two concurrent buyers cannot oversell the last SKU unit.
7. Unserviceable PIN prevents delivery promises and checkout completion.
8. Payment success is not shown on a merely initiated checkout; webhook duplication is harmless.
9. Reduced-motion mode leaves all customer tasks intact and accessible.
10. Changing logo/name uses a central brand configuration; bundle/package identifier is planned separately before app-store release.
11. An item present in app cart/order is the same when the later website is connected to the shared account.
12. Marketing content states product and seller facts truthfully; price reductions have appropriate source pricing records.

## Recommended MVP demo milestone
Approved AARVIKA motion design + nine department entry tiles (only Wedding active) + browse/search + wedding culture/state/function hub + 3-tier categories + sample catalogue **visibly marked DEMO** + single PDP + reviewable bundle builder + cart + admin catalogue CRUD. Then add payment/fulfilment only after real supplier, stock and prices are present. This gives a beautiful testable app without falsely presenting mock products as buyable inventory.

## Research and policy references
- User attachments: 10-page `developer_category_hierarchy_spec.pdf`; Clothing, Birthday (two versions), Anniversary and Furniture master maps; previous Wedding taxonomies and ER diagrams.
- https://www.igp.com/
- https://www.fnp.com/
- https://www.indianretailer.com/interview/retail-people/eretail/igp-how-indias-gifting-economy-moving-beyond-occasions
- https://docs.expo.dev/router/introduction/
- https://docs.expo.dev/develop/user-interface/animation/
- https://docs.swmansion.com/react-native-reanimated/docs/guides/accessibility/
- https://firebase.google.com/docs/firestore/security/rules-query
- https://firebase.google.com/docs/firestore/query-data/indexing
- https://support.google.com/googleplay/android-developer/answer/10281818
- https://developer.apple.com/app-store/review/guidelines/
- https://www.pib.gov.in/PressReleasePage.aspx?PRID=2308759
