# Full app visual and functional QA — 2026-10-25

Scope: actual running Expo web in development/fixture mode, UI-only corrections and Task 10 readiness audit. No backend implementation, Firebase requests, admin changes, payments or deployment. This is a fixture QA result, not Task 10 completion or a native release approval.

## Inspected

Root/mobile AGENTS.md, app-first master, category matrix, DESIGN_AND_MOTION.md, Task 10 (`tasks/10_STAGING_BACKEND_CHECKOUT_ORDERS.md`), Tasks 01–09 reports, current routes/components/contracts/state/services, original purple Home reference, Clothing/Birthday/Anniversary images, Furniture map and source catalogue references. Read-only legacy partial ZIP inspection is documented in TASK_10_READINESS.md. The requested alternative Task 10 filename does not exist; the matching checkout/orders task was used.

Launched `node node_modules/expo/bin/cli start --web --offline --port 8081` with telemetry disabled. Expo loaded .env.local, compiled and served http://localhost:8081. Headless installed Chrome inspected Home plus every department at 320×844, 390×844, 834×1024 and 1194×1024. These are real running-browser screenshots, not design mockups or native device captures.

## Problems fixed

- At 320px, percentage shortcut widths plus gaps wrapped into three columns. Measured grid widths now fit four readable shortcuts; tablets fit eight. Product grids use two phone, three portrait-tablet and four landscape-tablet columns, with fewer columns at large native font scale.
- Wrapped family/path buttons and always-expanded specification panels buried the first product under 1,200–2,800px of content. Family/path rails scroll horizontally with an explicit hint; specialist and generic filters expand on demand. Every option, query and reset action remains available. Selections survive collapsing/reopening.
- Small size/specification chips were narrower than 44px. Shared buttons now have both minimum width and height of 44px, plus accessible selected/expanded state. Installed React Native Web ignored the native accessibilityState property; explicit web aria-pressed and shared aria-expanded now expose these states. Final audit found zero visible controls below its 43px tolerance threshold across all 36 Home/department views; the size-M regression explicitly requires 44×44.
- Product cards had uneven title/price heights, quote prompts wrapped unnecessarily, and tablet artwork became excessively tall. Reserved title/metadata rows, compact inquiry text, consistent card stretching and capped proportional artwork correct this. Normal artwork glyph reduced 62→52px; large PDP artwork remains separate.
- Home hero had an oversized headline/full-width CTA and a narrow text column leaving tablet space unused. Headline is now 20–22px with compact padding and a content-sized CTA. Back/title share one row. Safe-area bottom padding and native keyboard avoidance were added; native behavior still needs device verification.
- Empty category rails no longer render. The shared palette was already correct and was retained: primary #62298E, plum #3E155C, lavender/pale/pink/peach/mint/cream as specified. Body/section/product/price typography remains within the approved compact scale. No merchant facts, filters, SKU IDs, pricing rules or source taxonomy changed.

Measured first-product position from the top of each scrolled content view, in pixels (not a performance timing):

| Screen | Before 320 | After 320 | Before 390 | After 390 |
|---|---:|---:|---:|---:|
| Home | 741 | 613 | 639 | 585 |
| Birthday | 1198 | 688 | 1021 | 667 |
| Personalized | 1410 | 744 | 1129 | 723 |
| Anniversary | 1250 | 688 | 1021 | 667 |
| Hampers | 1363 | 697 | 1161 | 651 |
| Clothing | 2272 | 684 | 1939 | 663 |
| Stationery | 2823 | 709 | 2413 | 663 |
| Furniture | 2558 | 944 | 2100 | 871 |

Wedding starts with tradition/function research templates rather than a product grid. Its complete template list remains long by design. Furniture retains its three inquiry actions and sector selector, so products still start below the initial phone fold. First-row cards measure 218px high at 320px and 240px at 390/tablet widths.

## Department/function results

| Department | Verified behavior |
|---|---|
| Wedding | Faith/region/tradition/function search, optional family plan, ceremony kit quantities and canonical component cart; research/family-approval caveats retained |
| Birthday | Arbitrary age, recipient, interest and budget compose; selection opens real fixture PDP |
| Personalized Gifts | Nine source families; engraving/text/photo schemas, preview, local upload, draft persistence and cart snapshots; combo builder validation |
| Anniversary | Arbitrary anniversary year and milestone/recipient matching reach personalized couple gifts |
| Hampers | Ten families and child paths; prebuilt/component sets, recipient/occasion/budget and packaging reach persistent cart; builder constraints preserved |
| Clothing | Eight source browsing columns; audience/specifications, selected size/colour artwork, guide and exact SKU cart; filters keep state when collapsed |
| Stationery | Eleven families and child paths; paper/GSM and relevant writing/art specifications reach PDP; unrelated specifications excluded by unit tests |
| Furniture | Nine Home + nine Commercial families, all 126 source groups; dimensions/material/finish filters, quote-only actions, photo draft/revision/withdrawal persistence |

Shared tabs, header/cart, search/back state, pagination/empty/missing product, sold-out SKU, wishlist, local demo profiles/guest merge, address validation and slow/failure/retry cases passed. The UI explicitly disables checkout pending staging; that is an intentional honest boundary, not a working checkout claim. Authentication remains a local demo profile and furniture inquiries are local drafts.

Motion review: press feedback is restrained; root navigation uses 280ms fade and disables it through the reduced-motion hook. Browser suite exercises reduced-motion and keyboard input. Native navigation smoothness, software keyboard/insets and screen-reader behavior were not measured on a device. No additional ornamental animation was introduced.

## Screenshot evidence

[Browse before/after gallery](visual-qa/index.html) — 68 before + 68 after individual screenshots, eight per-width metrics files and four overview sheets. Final overview sheets were visually reviewed across all eight departments and Home. Product-grid captures and existing specialist/cart captures supplement the landing views.

- [320px overview](visual-qa/contact-320.png)
- [390px overview](visual-qa/contact-390.png)
- [834px tablet overview](visual-qa/contact-834.png)
- [1194px tablet overview](visual-qa/contact-1194.png)
- [Clothing cart](task-08-apparel-cart-390.png), [Stationery PDP](task-08-stationery-390.png), [Furniture inquiries](task-09-inquiry-revisions-390.png), [Wedding kit cart](task-05-wedding-kit-cart-390.png), [Personalization cart](task-06-engraving-cart-390.png)

## Exact verification commands

Run from apps/mobile:

| Command | Result |
|---|---|
| `node node_modules/typescript/bin/tsc --noEmit` | Exit 0 |
| `node node_modules/eslint/bin/eslint.js .` | Exit 0, no lint warnings; initial gallery-script __dirname lint error corrected |
| `node --experimental-strip-types --test tests/*.test.ts` (final repeat also used `--test-reporter=dot`) | 33 passed, 0 failed (31 existing + 2 layout cases); Node module-format warnings only |
| `node node_modules/@playwright/test/cli.js test` | 20 passed, 0 failed in final full rerun (3.5m); earlier full run 20 passed in 45.0s |
| `node node_modules/expo/bin/cli export --platform all --output-dir dist` | Exit 0; local web + Android/iOS Hermes bundles; not native binaries or deployment |
| `node scripts/build-visual-gallery.cjs` | Exit 0; local gallery/contact sheets generated from captured PNGs |
| `npm audit --json --cache ../../.npm-cache` (npm CLI through node) | Exit 1: 5 high / 0 critical, two underlying advisories; see readiness report |

All four final visual cases assert no horizontal document overflow, no browser runtime/console errors, no nonlocal service requests and no undersized visible buttons. The network test blocks and records external requests; none were attempted in these audited views. Static review found 89 Button declarations with an action or explicit disabled state, but that does not prove every possible interaction path.

## Actual changed files

UI: `src/app/(tabs)/index.tsx`; `src/components/{catalog-browser,department-grid,facet-controls,furniture-home,gift-discovery,hamper-home,product,specification-browser,ui,wedding-home}.tsx`; new `src/domain/layout.ts` (layout calculations only).

Tests: modified `e2e/clothing-stationery.spec.ts`, `e2e/furniture.spec.ts`; new `e2e/visual-audit.spec.ts`, `tests/layout.test.ts`. Tooling: new `scripts/build-visual-gallery.cjs`. Evidence: this report, `TASK_10_READINESS.md`, `visual-qa/**` and the 18 historical task PNGs regenerated by existing browser tests ([the file manifest](VISUAL_QA_FILES.txt) records every filename). No dependency, catalogue fixture, business contract, environment, admin or backend file was modified. User-owned untracked .env.example and ignored .env.local were preserved.

Rollback: revert this bounded QA checkpoint; clear local demo data through Account if needed. No data migration or remote rollback is involved.

## Remaining gaps / next task

Original references show merchant photography and richer editorial imagery; current cards intentionally show DEMO DESIGN glyph artwork, with some platform-dependent emoji. This audit checks framing/layout, not real-photo crop quality or image downloading. Approved product photos/rights/alt text, gallery variants, loading/failure behavior and network image performance need trusted staging assets. No invented reviews, discounts or delivery promises were copied from reference imagery.

Still required: native Android/iOS runtime, large OS text/screen reader, keyboard/safe-area, real touch scrolling, animation/performance and background/restart QA; real authentication/private uploads; secure checkout/orders/receipts/tracking and payment fail/retry. Fixture slow/error simulation does not prove an HTTP API under slow network. Security advisories remain open. Task 11 app-ready gate is not satisfied.

Next bounded scope: Task 10A emulator-only API/contracts and security tests as detailed in [Task 10 readiness plan](TASK_10_READINESS.md). Keep fixture default until explicit environment gates and adapter tests pass. Stop here before backend changes or credential access.

Launch: `cd apps/mobile`, then `npm run web -- --offline --port 8081`; for native development use `npm start` with a compatible device/development build. The Razorpay native test build is not yet integrated.

Verification follow-up: an added accessibility assertion exposed missing browser expanded state (19 passed / 1 failed). Explicit ARIA support fixed it. A subsequent targeted assertion used the unselected label M although the selected label is checkmarked; corrected the selector to role + pressed state. Clothing/Stationery targeted rerun: 2 passed in 10.2s. Final full rerun: 20 passed / 0 failed in 3.5m. TypeScript/lint remained exit 0; final dot-reporter unit rerun passed all 33; final all-platform export exit 0.
