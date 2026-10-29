# Gift4U Admin Catalog / Merchandising Deep Audit & Fix Report

Date: 2026-10-05

## Scope audited

I merged and inspected both uploaded archives (`13.zip` and `13scripts.zip`) as one project so the root configuration, source code, API routes, tests, and admin UI could be traced together. I did not infer the bug from the screenshot alone: I followed the actual admin form → API route → validation/normalization → Firestore write paths in the uploaded source.

The project contains 39 admin page files, 65 admin API route files, and 286 TypeScript/TSX files under `src`. The affected Catalog / Merchandising flows were inspected end-to-end, and all 325 TypeScript/TSX files under `src`, `tests`, and `scripts` were syntax-transpiled after the fixes.

## Root-cause findings

| Bug / area | Proven cause in uploaded source | Effect | Fix |
|---|---|---|---|
| BUG-002 Category creation with blank image | `parseTaxonomyInput()` explicitly produced `image: undefined` and `description: undefined`, then `createTaxonomy()` spread the object directly into a Firestore document. Firestore rejects `undefined`. | Category creation fails exactly with the Firestore `undefined` error shown in the bug sheet. | Added deep Firestore sanitization and applied it at validation and write boundaries. Blank optional fields are now omitted, not stored as `undefined`. |
| BUG-003 Catalog master data unavailable | Categories, occasions, recipients and collections all share the same taxonomy parsing/write pattern. The same undefined-field failure therefore blocks master-data creation. | Product Taxonomy receives no usable category / occasion / recipient records, so catalog setup cannot be completed. | Fixed the shared taxonomy path once, so all four master-data types use safe writes. |
| BUG-001 Wedding event / category item not created, Existing Occasion empty | Wedding merchandising loads `/api/admin/occasions` and `/api/admin/categories`. When master data cannot be created, those relation lists are empty. The UI also gave poor feedback when a required relation list was empty. | Existing Occasion / Existing Category dropdown has no source records and Create Item cannot produce a valid relational item. | Fixed master creation, added explicit prerequisite feedback/disabled save when no active source records exist, and added server-side relation existence/active checks. |
| Merchandising sections failing even after master data exists | Server `ALLOWED_TYPES` did not match the actual admin page section types for Hampers, Personalised, and Lifestyle. | Valid UI submissions such as Hampers `collection`, `featured`, `curated` and Personalised `collection`, `promotion` were rejected as invalid types. | Server section contracts now exactly match all six admin merchandising pages. |
| BUG-004 / product creation undefined nested data | The uploaded ZIP does **not** contain a literal `personalization.required` field, so that exact field name in the screenshot belongs to a different/current deployed revision. However, the uploaded parser had the same failure class: image metadata, variant SKU, personalization values, delivery values, and SEO values could become nested `undefined` and were written to Firestore. | Product creation/update could fail with Firestore “Cannot use undefined” depending on the payload. | Product payload is now deeply sanitized before Firestore. This protects all nested optional fields rather than patching only one field name. |
| Product Editor ↔ product parser mismatch | Admin Product Editor sends variants using `name`, `value`, `price`, `sku`, but the server parser previously retained `name`, `options`, `priceDelta`, `sku` and discarded `value` / `price`. Product Editor sends personalization `fields`, `maxCharacters`, `imageUpload`, but the parser dropped those fields. | Products could save incomplete variant/personalization configuration even when no Firestore exception occurred. | Parser now preserves both the current editor schema and legacy fields. Existing records using legacy `maxLength` remain readable in the editor. |
| Category / subcategory hierarchy integrity | Blank parent was normalized to `undefined`; therefore clearing a parent was unsafe. The UI prevented choosing self but not descendants; server had no cycle protection; a parent category could be archived while active children still existed. | Hierarchy could become impossible to clear, cyclic, or leave active children under an archived parent. | Blank parent is stored as `null`; server validates parent existence/active state and prevents self/descendant cycles; UI excludes self and descendants; parent archive is blocked while active children exist. |
| Category page / Occasion page CMS optional fields | CMS normalizer intentionally returns optional `undefined` values and previously spread them directly into Firestore. | Saving a presentation with optional hero/banner/SEO fields blank could hit the same Firestore error. | CMS save now uses the same deep sanitization before Firestore. |

## Section contract verification

After the fix, the admin UI types and server-allowed types match exactly:

| Page | Working section types |
|---|---|
| Wedding | event, category, budget, culture, state |
| Birthday | recipient, ageGroup, category, giftType, budget |
| Anniversary | category, lovedOne, milestone, budget |
| Hampers | collection, featured, curated |
| Personalised | category, recipient, collection, promotion |
| Lifestyle | personality, brand |

Relation-backed sections were also checked against the UI and server together:

| Page / section | Required catalog source |
|---|---|
| Wedding → Event | Occasion |
| Wedding → Category | Category |
| Birthday → Recipient | Recipient |
| Birthday → Category | Category |
| Anniversary → Category | Category |
| Anniversary → Loved One | Recipient |
| Hampers → Collection | Collection |
| Personalised → Category | Category |
| Personalised → Recipient | Recipient |
| Personalised → Collection | Collection |

The server now verifies that the selected source document actually exists and is active; the admin dropdown only offers active source records.

## Category → subcategory → product workflow after the fix

1. Admin can create a top-level Category with image blank; blank optional fields no longer break Firestore.
2. Admin can create a subcategory by selecting an active parent Category.
3. Admin can move an existing subcategory back to top level because the parent relationship can be explicitly cleared with `null`.
4. Admin cannot make a category its own parent or move it under one of its descendants.
5. Admin cannot archive a category while it still has active subcategories.
6. Product Editor displays category hierarchy as `Parent › Child › Subchild`, so products can be assigned to the intended level without ambiguous duplicate names.
7. Product variants and personalization settings sent by Product Editor are preserved by the server parser.
8. Product and taxonomy payloads are sanitized again at the Firestore write boundary, providing defense in depth if another admin client sends optional fields.

## Files changed

Runtime changes are intentionally limited to the affected Catalog / Merchandising system; unrelated customer, order, payment, authentication, shipping, and other admin business flows were not rewritten.

- `src/lib/firestore-sanitize.ts` — new deep undefined sanitizer that preserves non-plain class instances such as Firestore values.
- `src/lib/catalog/validation.ts` — safe taxonomy/product normalization; preserves editor variant/personalization/delivery schema.
- `src/lib/catalog/server.ts` — safe Firestore writes and category hierarchy integrity checks.
- `src/lib/catalog/types.ts` — category parent can explicitly be `null`.
- `src/components/admin/catalog/TaxonomyManager.tsx` — clearable parent relation and descendant-cycle prevention in UI.
- `src/components/admin/products/ProductEditor.tsx` — hierarchical category labels and legacy personalization compatibility.
- `src/lib/merchandising/server.ts` — section type contract fixes plus relation existence/active validation.
- `src/components/admin/merchandising/MerchandisingManager.tsx` — active relation options and clear prerequisite feedback.
- `src/app/admin/merchandising/wedding/page.tsx` — Wedding relation prerequisites / active source dropdown behavior.
- `src/lib/merchandising/cms.ts` — safe optional CMS Firestore writes.
- `tests/catalog-validation.test.ts` — regression coverage for blank optional taxonomy fields and Product Editor payload preservation.

No global `ignoreUndefinedProperties` Firebase setting was enabled. The fix is localized to the affected write paths so unrelated working Firestore behavior is not silently changed.

## Validation performed

| Validation | Result |
|---|---|
| Syntax transpile of all TS/TSX under `src`, `tests`, `scripts` | **325 checked, 0 syntax-error files** |
| Focused strict TypeScript check for catalog types + sanitizer + validation | **Passed** |
| Catalog validation regression tests (transpiled with TypeScript and run with Node test runner) | **6/6 passed** |
| Taxonomy blank image / description produces no nested `undefined` | **Passed** |
| Blank category parent becomes `null`, not `undefined` | **Passed** |
| Product Editor variant `value` / `price` preserved | **Passed** |
| Personalization `fields` / `maxCharacters` / `imageUpload` preserved | **Passed** |
| Product payload contains no nested `undefined` in regression case | **Passed** |
| Merchandising admin section types vs server allowed types | **6/6 pages match** |
| UI relation mapping vs server relation mapping | **All mapped relation-backed sections match** |
| Core project JSON files | **Parsed successfully** |

### Full build limitation

A complete `npm ci` / Next.js build could not be executed in this sandbox because the uploaded archives do not contain dependencies and the environment cannot retrieve every package. An explicit offline install attempt failed because `zod-validation-error-4.0.2.tgz` is not available in the local npm cache. This is an environment/dependency-availability limitation, not a reported build error from the modified source.

### Live Firebase limitation

The uploaded project contains no `.env` file, service-account file, or other live Firebase credential material. Therefore I did not claim a live Firestore write test. The affected request/data/write paths were verified from the supplied code and with local parser/contract tests. After placing the fixed source into the normal development/staging environment, the final verification should be performed against your staging Firebase project before production.

## Recommended staging verification sequence

| Step | Action | Expected result |
|---|---|---|
| 1 | Catalog → Categories → create top-level category with Image URL blank | Creates successfully; no undefined Firestore error. |
| 2 | Create a child category and select the category from step 1 as parent | Child saves and appears under the correct parent context. |
| 3 | Catalog → Occasions / Recipients / Collections → create at least one record in each with optional image blank | Each creates successfully. |
| 4 | Merchandising → Wedding → Wedding Events | Existing Occasion contains active occasion records; Create Item succeeds. |
| 5 | Merchandising → Wedding → Wedding Categories | Existing Category contains active category/subcategory records; Create Item succeeds. |
| 6 | Test Birthday, Anniversary, Hampers, Personalised, Lifestyle sections | Each section type accepted by API and saves. |
| 7 | Products → Add Product → choose category/subcategory + occasion + recipient, add variant and personalization | Draft saves with selected taxonomy and editor fields preserved. |
| 8 | Publish a fully valid product | Publishes; product record and inventory record are written without undefined values. |
| 9 | Try moving a parent under its child | Rejected with hierarchy error. |
| 10 | Try archiving a parent that has an active child | Rejected until child is archived/moved. |

