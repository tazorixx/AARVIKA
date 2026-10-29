# AARVIKA — Read-only audit of `13scripts(1).zip`

Audit date: 2026-10-24. Source inspected without running application code, executing repository scripts, contacting services, changing database entries or editing the original ZIP.

## Scope & completeness

- ZIP includes 570 entries (238 directories, 332 files), including 212 `.ts` and 113 `.tsx` files, plus test sources.
- Includes `src/app/admin`, React/Next.js storefront, Firestore API routes, catalog services, ImageKit upload route, homepage section editor, merchandising manager and tests.
- Does **not** include root `package.json`, lockfile, `tsconfig.json`, Next configuration, `.env` or a working deployment/database snapshot; therefore no full build, live login, network upload, payment, deployed behaviour or Firestore data verification was possible.
- Findings below distinguish confirmed mismatches visible in code from runtime hypotheses requiring reproducible tests.

## Confirmed findings, ordered by priority

### P0 — Product editor and backend parser disagree (data-loss risk)

- `src/components/admin/products/ProductEditor.tsx:30-41, 486-513` builds variant objects with `name`, `value`, `price` and `sku`.
- `src/lib/catalog/validation.ts:89` reconstructs variants using `name`, `options`, `priceDelta`, `sku`, dropping `value` and `price`. Existing variant configuration could change on save.
- `src/components/admin/products/ProductEditor.tsx:37-41, 525-553, 1544-1652` submits `personalization.fields`, `maxCharacters`, `imageUpload`.
- `src/lib/catalog/validation.ts:90` only parses `enabled`, `maxLength`, `instructions`. It drops `fields`, `maxCharacters`, `imageUpload`.
- `src/components/admin/products/ProductEditor.tsx:76-86, 146-156` models fee, midnight, delivery windows, slot fees and zone mode; `src/lib/catalog/validation.ts:91` preserves only min/max days and sameDay. Saving a product can discard the rest.
- `src/app/api/admin/products/route.ts:7` and `src/app/api/admin/products/[id]/route.ts:7` always use this parser on POST/PATCH. `src/lib/catalog/server.ts:438-456` writes parsed fields back.
- **Recommendation:** define a single canonical schema and round-trip tests (read → edit → save → read). Preserve both legacy and newer variant formats before migrating. Do not blindly replace the parser, because downstream components may depend on existing normalization.

### P0 — Publishing rules block generic goods

- `src/lib/catalog/validation.ts:32-60` demands one category, one occasion and one recipient to publish; this conflicts with general apparel, furniture and stationery that should not require occasion/recipient classification.
- SKU and title are mandatory even to save a draft (`src/lib/catalog/validation.ts:63-67`), while editor expects manual entry (`src/components/admin/products/ProductEditor.tsx:856-885`).
- `tests/product-publishing.test.ts:44-49` enforces the old restrictive occasion and recipient requirements and must be intentionally updated with the new business rules.
- **Recommendation:** publish requirements by product type and relevant department. Mandatory fields: valid sellable SKU, proper category, price/stock/delivery/media rules as applicable. Occasion and recipient are optional discovery facets except in explicitly configured cases. Draft requirements should be less strict than publish rules.

### P0 — Product visibility filter may hide legitimate personalized products

- `src/lib/catalog/public.ts:11-21, 51-72` drops live products when `personalization.imageUpload` is true. This is an explicit code filter, regardless of inventory or category; confirm the original rationale before removing it.
- The parser currently drops that flag, creating conflicting behaviours between older stored records and new saves.
- **Recommendation:** document expected visibility and test photo-customisable SKUs in PLP/PDP/search. Any intentionally excluded product should explain why in admin.

### P1 — Category hierarchy exists but lacks enforced depth and easy navigation

- `src/lib/catalog/types.ts:15-17` supports `Category.parentId`.
- `src/components/admin/catalog/TaxonomyManager.tsx:396-409` provides a flat parent dropdown with *all* active category options; no level-1/2/3 enforced selection or visual tree.
- `src/lib/catalog/validation.ts:24-26` simply accepts a `parentId`; `src/lib/catalog/server.ts:56-99,101-198` handles slug lock and writes but does not establish that parent exists, belongs to allowable depth, or cannot create cycles.
- `src/components/admin/products/ProductEditor.tsx:391-415,919-970` shows all categories as selection pills instead of a cascading main → sub → child chooser.
- **Recommendation:** preserve stable IDs, add canonical level validation (max 3), no cycles, parent availability, category breadcrumbs, search and a tree picker; migrate legacy items by mapping, never delete silently.

### P1 — Homepage control is partial, not a full visual page builder

- `src/lib/admin/homepage.ts:1-19` allows only `hero`, `banner`, `text`, `link` block types.
- `src/app/admin/homepage/page.tsx` already supports drafts/edits/publish/scheduling/reordering and should be reused.
- `src/app/page.tsx:11-25` renders many hard-coded blocks after `HomepageSections` (hero, category rail, gifts, product rail, new launches, trust promises); admin cannot rearrange all of them.
- `src/components/home/HomepageSections.tsx:6-14` renders all user-added blocks with essentially the same oversized image/card structure, not distinct product grids or category collections.
- `src/components/CategoryRail.tsx:6-11` hardcodes 6 icon slots and uses only the first six categories. `:33-43` links via `/occasions?category=` instead of directly to the canonical category page.
- **Recommendation:** extend the existing homepage editor with typed blocks: category grid, product collection, promotional banner, carousel, trust row, combo CTA, featured wedding collections. Allow per-breakpoint density, preview, visibility and drag order; preserve the current draft/publish infrastructure.

### P1 — AARVIKA product discovery won't scale on fixed response caps

- `src/app/api/catalog/route.ts:27-46` first fetches at most 200 live products, then filters *in memory*, so matching product number 201+ may never be returned.
- `src/app/api/admin/products/route.ts:6` also fetches only 200 entries; `src/components/admin/products/page.tsx:67-78` searches only the items it received.
- `src/app/api/catalog/route.ts:30-33` caps each taxonomy array at 100 (potentially too small for 3-level taxonomy).
- **Recommendation:** move to query-aware pagination and an appropriate search service; do not rely on client filtering a truncated global set.

### P1 — Merchandising still models old department set

- `src/lib/merchandising/types.ts:1-9` supports `wedding`, `birthday`, `anniversary`, `hampers`, `personalised`, `lifestyle` but not `clothing`, `stationery`, `furniture`, proposed ninth department.
- `src/lib/merchandising/server.ts:80-87` limits available section types, and Wedding only supports event, category, budget, culture and state. It lacks explicit `tradition → ceremony → product requirement` relationships.
- `src/lib/merchandising/product-query.ts:44-75` already supports some linked merch item filtering, so reuse rather than discard it.
- **Recommendation:** separate canonical product taxonomy, occasion collections, culture/region/ceremony mappings and page presentation. Add per-department blocks and configurable filters, without creating a second product database.

### P2 — User experience and truthfulness

- `src/components/admin/products/ProductEditor.tsx:823-1823` is one long form with many panels and many independent taxonomy pills. Reorganize into Basic, Category & Visibility, Media, Price/SKU/Stock, Optional Details, Review & Publish with autosave drafts and contextual validation.
- Product editor UI `:856-885` requires entering title, SKU and slug manually; slug can be generated and advanced values collapsed.
- `src/components/home/HomeHero.tsx:25-29, 69-75` contains unverified promotional promises such as same-day in 50+ cities and same-day cutoff; replace with verifiable, admin-managed text before launch.
- Public/category presentation includes hardcoded pink/blue styling; AARVIKA purple design tokens can be introduced incrementally, without changing admin functionality first.

### P2 — Existing tests need new schema coverage

- The ZIP includes tests under `tests/`, but no root dependencies are supplied, so they were not executed in this audit.
- `tests/catalog-validation.test.ts:60-73` expects a draft with a wrong thumbnail to fail, while `src/lib/catalog/validation.ts:104-106` only performs gallery validation on live status. Flag for execution and reconciliation.
- Add tests for roundtrip of all editor fields, category levels and cycles, publish rules by department, homepage blocks and search pagination.

## Components worth preserving

| Function | Existing source |
|---|---|
| Admin authorization | `src/lib/catalog/http.ts`, `src/components/admin/AdminGuard.tsx` |
| Main catalogue transactions and slug locks | `src/lib/catalog/server.ts`, `src/lib/catalog/slugs.ts` |
| Admin product list and editor | `src/app/admin/products/page.tsx`, `src/components/admin/products/ProductEditor.tsx` |
| Category CRUD | `src/components/admin/catalog/TaxonomyManager.tsx` |
| Image upload | `src/app/api/admin/uploads/imagekit/route.ts` |
| Homepage drafts/publishing/scheduling | `src/app/admin/homepage/page.tsx`, `src/app/api/admin/homepage/*` |
| Department merchandising | `src/components/admin/merchandising/MerchandisingManager.tsx`, `src/lib/merchandising/*` |
| Shopping and checkout foundations | `src/lib/cart/*`, `src/lib/checkout/*` |
| Related product configurations | `src/app/api/admin/products/[id]/related/route.ts` |
| Existing tests | `tests/` |

## Proposed safe Codex implementation order

1. Obtain **complete** repository with its root manifest, dependency lockfile, environment documentation and clean staging credentials; establish baseline typecheck/tests/build before changes.
2. In a dedicated branch, add **failing tests** demonstrating editor→parser field loss, optional occasion/recipient for generic goods, incorrect personalized-product visibility, and edit/save persistence.
3. Fix product parser/UI payload alignment **without altering existing stored records**. Re-run specific tests and the full suite in staging.
4. Add a simple product wizard on top of the corrected schema, with draft support, conditional fields, auto-generated SKU/slug controls and in-context errors.
5. Audit legacy category records and create a migration report; add main→sub→child UI plus validation without rewriting historical product IDs.
6. Extend homepage builder using existing drafts/publishing: category grids, PLPs, product collection rails, banners, combo CTAs, per-screen preview and ordering.
7. Connect one complete product workflow: add → upload → draft → publish → category → homepage (where selected) → PDP → cart; compare directly in staging.
8. Add the AARVIKA purple design system to the customer app and preserve admin usability while making both use the same backend.
9. Expand Wedding's culture/state/ceremony model, then Birthday and Personalized Gifts, and later other departments.
10. Roll out production only after staging parity, data backup, migration signoff and regression tests.

## Important limitations

This is a **source-code audit**, not a tested diagnosis of a specific runtime failure. I cannot establish whether the live site is running this same code revision; whether ImageKit credentials, permissions and environment variables are correct; whether Firestore currently holds inconsistent records; or whether scripts build without the missing root files. No existing environment or record was changed.
