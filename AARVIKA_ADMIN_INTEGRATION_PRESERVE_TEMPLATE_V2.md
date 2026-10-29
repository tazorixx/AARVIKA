# AARVIKA — PRESERVE EXISTING ADMIN TEMPLATE + REQUIRED APP INTEGRATION

## TOP-PRIORITY OWNER OVERRIDE — EXISTING ADMIN DESIGN IS APPROVED; DO NOT REDESIGN IT

**This instruction supersedes any earlier use of “redesign,” “new admin design,” “modernize the whole admin,” or “rebuild.”** The current admin UI/template is already approved and should remain recognizably the **same admin panel**, not become a different dashboard. Make ONLY the AARVIKA brand-colour changes and feature-specific UI adjustments required by the integration below. The owner wants **minimal change, maximum compatibility**.

**Preserve as-is unless a specific requested feature cannot work without a bounded change:**
- Existing app shell, sidebar, top navbar, dashboard arrangement, information hierarchy, page routes, panel/card styles, data tables, tabs, spacing density, typography sizing/weights, icons, component library, form patterns, dialogs/popovers, loading states, responsiveness and interaction patterns.
- Existing functional admin features and their location in the navigation; do not remove, hide, rename or rehome working functionality just to simplify the design.
- Existing login/auth experience, permissions, data records and deployments, apart from strictly necessary safe compatibility work.
- Current tables' columns and filtering controls wherever already useful. Extend existing screens instead of creating parallel replacements.

**Permitted visual modifications:**
1. Rebrand visible **Gift4U** labels to **AARVIKA** only where they genuinely represent this admin's storefront brand; do not change internal Firebase project IDs, API identifiers, stored keys or other integrations.
2. Map existing admin design tokens, CSS variables or theme provider to the AARVIKA brand **primary `#62298E` and deep plum `#3E155C`**, with light lavender/pastel accents **only where the current template already uses accent surfaces**. Keep its background, typography, shadows, border radii and spacing system unless a specific issue demands adjustment. Do not repaint every surface purple.
3. Apply the branding consistently to primary buttons, active sidebar/nav states, links, focus rings and selected chips **without altering their layout**. Retain semantic success/error/warning colours and maintain readable text contrast.
4. Add only the input fields, validation, tabs, inline controls and compact subpanels needed for products, categories, SKUs, homepage sections, personalization, hampers and furniture. Reuse existing components and interaction conventions.
5. Where an existing admin page already meets a requirement, **reuse it unchanged** and avoid unnecessary refactoring.

**Explicitly forbidden without fresh owner approval:**
- Replacing the admin template, installing another dashboard/UI kit, changing the layout to a different sidebar or card system, rebuilding the admin from scratch, wholesale Tailwind/CSS refactors, broad font/spacing/icon swaps, moving existing sections to new pages, removing working features, or designing a new activity page.
- Making the admin look identical to the mobile storefront; only **brand tokens and necessary functionality** should match. Admin must keep its own efficient desktop-first template.
- Changing production Firebase, payments, order records or existing admin workflows just to accommodate styling.

**Baseline / minimal-diff visual gate:**
- Capture screenshots of the *existing* admin dashboard, sidebar, product list, Add/Edit Product, categories and any homepage/settings pages **before changes**, when source can be run safely.
- Document precisely which elements need branding changes or feature additions, and why. Implement those on top of existing components.
- Capture the same screens **after changes**; compare structure/navigation against baseline. Unexpected movement, missing controls or widespread visual changes are failures and must be corrected.
- Separate brand-token edits from functional edits into reviewable commits; list untouched pages and changes explicitly. If baseline cannot be run, do not guess a new UI.

## Owner authorization and objective

Tasks 01–09, visual QA, and Task 10A are implemented. **I now authorize development of the AARVIKA admin integration, minimal brand-colour changes and necessary admin feature additions.** The first priority is to make the existing admin the manageable source of truth for the AARVIKA customer app. Implement the required source changes where the **complete, runnable admin repository** is actually available, not merely create a speculative plan. Preserve the mobile application's eight department experiences and current functioning fixture/local-API modes.

Current customer-app workspace: `C:\Users\ASUS\Desktop\AARVIKA`
Mobile: `apps/mobile`
Local catalogue API: `apps/local-api`
Shared catalogue: `packages/catalogue`
Task 10A checkpoint: `db1d46c` (confirm current branch, dirty state, and newer commits before altering code).
Firebase project display name: `AARVIKA`; legacy project ID: `gift4u-4210f`. Do **not** treat that as staging or safe-to-write merely because it was renamed.

**Required source discovery gate:** Earlier inspection found only `references/13scripts_PARTIAL_SOURCE_READONLY.zip` (partial Next.js/Firebase admin snapshot), without complete root package/build/deployment configuration. First inspect the current AARVIKA workspace and any **explicitly provided** full admin project path. Do not silently treat the snapshot as a current runnable repo. If the full source is absent, you may build testable shared contracts and a migration specification, but **stop before claiming the old admin was modified or connected**. Report exactly what full source folder/repository and configuration are missing. Do not overwrite, extract over, or modify any separate project without its path and an explicit backup/branch.

## Core product decision

- Keep **one canonical catalogue and one SKU inventory authority**. Admin creates/edits products; the mobile app reads published products through typed adapters. Do not build a duplicate hardcoded database or different product editor for each department.
- The catalogue hierarchy has exactly **Main department → Subcategory → Child category (maximum 3 levels)**. Occasion, recipient, culture, faith, state/region, wedding ceremony, anniversary milestone, age, style, fabric, colour, size and room are facets or independent relationships, **not extra taxonomy levels**.
- One product may appear in several departments, child categories, occasions, collections and homepage sections **without duplicating the canonical product**. Each SKU has authoritative stock, price and variant attributes, regardless of placement.
- Existing products, orders, roles, customer records, payment history and routes must be preserved unless a scoped, reviewed migration is separately approved.
- This phase prioritizes **real catalogue management, functioning admin↔mobile preview, and preservation of the approved admin template**. Defer live Razorpay, courier APIs, SMS OTP, live checkout, and unrelated website work.

## Phase 0 — read-only baseline and migration mapping (mandatory)

1. Read `AGENTS.md`, `AARVIKA_FULL_APP_FIRST_MASTER.md`, `CATEGORY_FEATURE_MATRIX.md`, `DESIGN_AND_MOTION.md`, `apps/mobile/evidence/TASK_10A.md`, `apps/mobile/evidence/TASK_10_READINESS.md` (if present), Tasks 12–13, and the complete current admin repo's own instructions.
2. Inspect current branches, Git status, environment documentation, package manifests, Firebase project IDs, Firestore rules, collection schemas, authentication/roles, APIs, admin routes and deployment targets. Identify whether admin is a Next.js/Firebase project and precisely where it currently runs. Never print secrets.
3. Confirm the complete admin source is present and buildable. Run baseline TypeScript/lint/build/tests before modifications. Record initial failures independently from introduced failures.
4. Inspect `Add Product`, `Edit Product`, product list, variants, media, collections, categories, homepage configuration, customer storefront reads, roles and audit metadata. Verify each suspected historic issue **in actual current source**, including product fetch caps, parser field loss and category requirements. Do not assume old ZIP findings are still true.
5. Decide how admin and mobile share the API/contracts and deployment configuration; do not start two competing product schemas. Produce a concise field map, entity diagram, read/write path, environment matrix and risk list.
6. Check whether `gift4u-4210f` contains live data only through **approved, authorized read-only access**; absent such access treat it as **potentially live**. No cloud writes, migrations, rule deployment or account changes in this phase.
7. Create isolated Git branches/checkpoints for admin and app as appropriate. Preserve existing `.env*` files and never commit secrets.

## Phase 1 — shared domain and trusted catalogue adapters

Implement a versioned typed contract shared between admin, future backend and `packages/catalogue`:

- `Department`, `Category {id, departmentId, parentId, level}`, independent `FacetDefinition`/`FacetValue`.
- `Product` with stable ID, title, descriptions, status (`draft`, `published`, `archived`), placements, custom attributes, artwork/media references, SEO/display fields as needed, created/updated actor/time.
- `SKU` with stable ID, variant attribute keys/values, price in integer paise, currency, available/reserved stock, safety policy; prevent duplicate variant combinations.
- `Collection`/`PageSection` and **versioned published home layout** with visibility, ordering, image/banner references, placement references, and preview/published states.
- `PersonalizationSchema` for optional name/text/photo/engraving/character limits/field requirements/asset constraints.
- `BundleTemplate` and `BundleComponent` referencing existing SKU IDs, packaging cost, exclusions, capacity, discounts only if explicitly configured, inventory implications.
- Furniture `InquiryType`, specification definitions and inquiry status separate from payable order.
- Compatibility adapters for current mobile fixture and local API plus future guarded staging adapter. Do not switch client to cloud silently. Admin mutations go through a trusted role-verified backend or correctly secured Firebase rules, never client-side service-account credentials.

If old schema differs, implement an **idempotent, previewable mapping/migration tool** for emulator/staging only; detect conflicts and preserve original fields. Never run against existing cloud data without further approval.

## Phase 2 — make the existing admin simple and compact

Keep the current admin template, layout, page structure, components, typography, grid density and responsive behaviour **as the default**, not merely “where practical.” Make only narrowly scoped additions for missing functionality and AARVIKA primary/accent colour replacements. Avoid a broad redesign or replacement of any currently working screen. Optimize existing tables/forms only when the required feature or a verified usability defect demands it.

### A. Department + category management

- Admin can create/rename/reorder/hide/re-enable categories within the three-level limit and assign them to one of the eight approved departments.
- Eight departments: **Wedding, Birthday, Personalized Gifts, Anniversary, Hampers, Clothing, Stationery, Furniture**. Ninth remains reserved and unpublished.
- Preserve source category child labels and families. Require parent selection and prevent cyclic hierarchy, orphan removal and deletion while products reference a category without a deliberate reassignment/archival flow.
- Support category display name, slug, thumbnail/icon, sort order, homepage visibility, metadata and preview; admin-created categories must appear in mobile via contract without code edits.
- Provide fast searchable tree/breadcrumb selector `Department → Subcategory → Child`, and multi-placement chooser without product duplication.

### B. Universal Add/Edit Product — most important workflow

Implement compact and reliable **one-product editor**, with department-aware sections, preserving existing IDs and data. Fields:

- Basic: title, description, product type, canonical category, additional category/department placements, status, display tags.
- Price: selling price, compare-at price only if valid, tax/charges configuration where applicable; Indian rupees displayed accurately, stored in integer paise.
- Media: multiple images, reorder, alt text, cover image and upload progress; secure storage only when tested backend enabled, otherwise demo/preview clearly labelled.
- Variant builder: size, colour, fabric, material, pack, finish and other typed options; SKU/unique variant code, per-SKU prices and stock, optional image per variant, bulk edit; never silently discard submitted variant data.
- Occasion/recipient/culture/region/ceremony/age/milestone attributes **conditional by product**, not mandatory for all products.
- Personalization: text/photo/name/engraving schema, character limits, required vs optional fields and media type/size limits, preview configuration.
- Bundles/sets: existing component SKUs, quantity and packaging; canonical stock and rules, no new inventory pools per combination.
- Fulfilment: dimensions/weight/shipping class and furniture inquiry-only flag; no invented delivery promises.
- Draft save, preview, publish/unpublish, edit, duplicate, archive/restore, safe delete policy, helpful validation errors, unsaved-changes warning, predictable feedback and failure retry.

**Check and fix historic data-loss concern:** current editor and backend must accept/persist/render the same `variant.value`, price, personalization fields, `imageUpload`, `maxCharacters`, delivery fields etc. Ground field names in current source; add round-trip serialization tests. Do not make optional occasion/recipient mandatory for unrelated product types. Preserve unicode and existing text.

### C. Department-specific editor panels, not separate systems

- Wedding: faith/culture, state/region, wedding function/ceremony, bride/groom, kit mapping, optional traditions requiring family confirmation.
- Birthday: recipient, interests, age/milestone, personalization, budgets.
- Personalized Gifts: nine source families, upload/text/engraving design schema.
- Anniversary: recipient, occasion years/milestones, customization.
- Hampers: ten source families, reusable builder templates, packaging, compatibility and component pricing/stock.
- Clothing: audience/type, size chart, size/fabric/colour/fit/age/occasion, per-size SKU.
- Stationery: eleven source families, relevant paper/ink/lead/pack/grade/art-medium specs only.
- Furniture: nine Home + nine Commercial families, dimensions/material/finish, custom quote vs buy-now eligibility, room sets and inquiry configuration.

### D. Product list / bulk management

Search/filter by title/SKU, department/category, status, stock, tags, price and updated date; proper **cursor pagination** rather than fetching only 200 items then filtering. Useful columns, quick preview/edit, multi-select bulk publish/archive/reassign (with server-side authorization and error reporting), SKU inventory adjustments with reason and conflict protection. No destructive default actions.

## Phase 3 — admin-controlled home and collection builder

- Manage the mobile homepage entirely from a stored, versioned section configuration, not hardcoded front-end arrays.
- Supported blocks: hero banners/slides, compact department/category rail, featured collections, product grids, occasions, gifting by recipient, budget rails, seasonal/festival promotions (within approved taxonomy, not an invented ninth department), personalized product modules, hamper modules.
- Admin can add/remove/reorder sections, change heading/subheading, card count/layout where supported, visibility, linked target, product collection, audience filters, active date windows and imagery.
- Visual preview for mobile widths; separate **Save Draft** from **Publish**. Publish validates link targets, assets and published product availability. App reflects newly published configuration through service adapter with reliable loading/error/fallback behavior.
- Section deletion/reordering does not delete linked products. Offer consistent rollback to the previous published version.
- Keep mobile bottom navigation **Home, Categories, Offers, Wishlist, Account**, cart in header. Do not break specialized department routes or compact purple styling.

## Phase 4 — essential admin workflows only

- Media library and image reuse; authorized uploader, file validation, metadata and safe deletion references.
- Personalization templates, bundle/kit templates and furniture inquiry list + status updates (do not falsely claim a real seller/vendor quote when only local simulation exists).
- Customer accounts, real order/payment/fulfilment modules should be visibly gated until their backend/API and authorization exist; do not invent successful real orders.
- Roles: owner/admin/editor permissions as supported by actual existing system; least-privilege reads/writes. Record `createdBy`, `updatedBy`, timestamp and reason for sensitive admin actions. If useful, expose a **small inline 'who/when' detail popover on each relevant product/section**, not a new global activity page.
- Use accessible compact notifications rather than intrusive modal confirmations for routine non-destructive operations.

## Phase 5 — real admin↔app integration, safety first

1. Maintain independent modes: `fixture` (unchanged), `local-api` (unchanged demo reads), and a **new isolated emulator/staging mode** only when actual secure backend is configured.
2. Since existing `apps/local-api` is deliberately **read-only**, do not secretly add admin writes to its public GET server. For development, either build a separately authorized admin API with local data store and tests or use correctly secured Auth/Firestore/Storage emulators. Explain the exact choice and its security boundary.
3. Demonstrate end-to-end on **emulator or isolated staging only**:
   - Admin creates main/sub/child category → mobile displays it.
   - Admin creates draft product → mobile does not show it publicly.
   - Admin publishes product with two SKUs → mobile shows correct variant prices/stock.
   - Admin edits image, personalization fields and price → mobile refreshes reliably.
   - Admin assigns product to a second collection → same product ID/SKU and stock on both placements.
   - Admin reorders home sections and publishes → mobile order changes without app redeploy.
   - Admin unpublishes product → public browse and search no longer show it (existing cart gracefully handles change).
   - Unauthorized or unauthenticated mutations fail; mismatched schemas and invalid configurations fail safely.
4. Keep application code compatible with the future customer website, but **do not build the website in this task**.
5. Do not enable live payments, courier APIs, SMS OTP, production Firebase or cloud deployments.

## Testing and delivery gates

Run at each checkpoint: admin TypeScript/lint/build and relevant admin tests; shared contract/schema tests; customer mobile TypeScript/lint/unit and browser regressions; Android/iOS/web bundle exports; security rules/role denial tests; integration E2E. Inspect visual QA at 320/390/834/1194 widths as applicable. Verify no new hardcoded 200-item caps, no inconsistent currency conversions, no duplicate SKUs, no secrets committed and no changes to unrelated projects.

Provide a separate report for each phase:
- Actual admin source path/revision and verified baseline; feature diffs; file manifest and commit.
- Data model, API requests/responses, schema migration/read compatibility, staging/emulator setup.
- Exact implemented workflows and what remains mocked/disabled.
- Test output and visual screenshots (admin Add Product, product list, category tree, homepage editor; mobile new product/home sections).
- Exact local run commands for admin, backend/emulator and mobile.
- Blocking owner decisions (e.g. existing admin source location, staging isolation, image upload provider, Firebase auth role policy) only where genuinely necessary.
- Rollback plan for code and data. **Never report an unverified integration as complete.**

**Execution approach:** Perform Phase 0 first. If the complete admin source is present and its safe isolated testing environment is available, implement Phases 1–5 in logically scoped commits, fixing regressions as you proceed. If missing, produce the maximum safe contracts/UI groundwork, identify exact blocking inputs and STOP before risky writes. Do not ask approval at every ordinary code step; request a new approval only before touching live Firebase, cloud deployment, real migrations, payment providers or previously unspecified separate repositories.
