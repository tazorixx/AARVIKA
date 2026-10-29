# AARVIKA admin unification — 27 October 2026

## What was inspected

Read the existing implementation reports, relevant catalogue contracts, department editors, ImageKit routes, admin navigation, and read-only records in `gift4u-4210f`. The existing template, product editor, inventory, homepage manager, taxonomy editors, permissions and uploader remain in place.

## Eight department pages

The Merchandising sidebar shows Wedding, Birthday, Anniversary, Personalized Gifts, Hampers, Clothing, Stationery, and Furniture. The old Lifestyle, Occasion Pages, Category Pages, and Merchandising Modes links are hidden from that sidebar; their routes and records remain available. The Category editor links directly to the selected Category Page editor for banner and featured settings. The store badge shows the actual shared Firebase project in shared mode and the isolated label in emulator mode.

Wedding now uses the same manager as the other departments, with its existing records intact. Clothing, Stationery, and Furniture have department pages. All eight pages provide hero controls, image cards, order and visibility, preview, and featured product selection. Birthday and Anniversary also provide featured sections. Product-specific sizes, fabrics, personalization, SKU stock, hamper components, and furniture inquiries remain in the existing product editor and related admin tools.

For related category, recipient, occasion, and collection items, an admin can select a master record or create one inline. Inline creation validates scope and duplicates and writes the master and presentation together in one Firestore transaction. Existing-item edits also check section slug conflicts. These writes use the existing authenticated catalogue-admin API and normal admin validation; no live write was used for verification.

The existing ImageKit uploader is reused. The relevant editors provide preview, replace, remove, and public CDN URL reuse. Shared-mode merchandising image URLs must be public ImageKit references. The secure mobile catalogue projection maps department heroes, visual shortcuts, and featured live products into the existing mobile department layout. Unpublished product IDs are excluded.

## Real catalogue state, read-only

`gift4u-4210f` currently has 0 products, 0 SKUs, 0 categories, 0 collections, 0 recipients, 0 occasions, and 0 homepage sections. It has 20 existing Wedding presentation items: 7 states, 7 cultures, and 6 budgets. All 20 have ImageKit URLs and appear in the mobile Wedding projection. None has a linked category or occasion master record. The local 535-category reference has not been imported; see [taxonomy mapping preview](TAXONOMY_MAPPING_PREVIEW.md).

## Focused verification

- Admin TypeScript and mobile TypeScript: passed.
- Changed-file admin and mobile ESLint: 0 errors. Existing image and hook warnings remain.
- Isolated emulator inline Birthday master create, select, and duplicate rejection: passed earlier in this task, 1 test; disposable records were removed.
- Existing SUPER_ADMIN sign-in, dashboard, Clothing page, shared-environment label, and seven Wedding culture records: passed in browser verification.
- Read-only shared mobile API: Wedding returned six sections and 20 ImageKit image shortcuts; 0 live products.
- Mobile shared-preview browser check: passed, including Wedding “Explore states”.
- A later repeat of the isolated test was stopped because the local emulators were no longer listening; it did not target the real project.

## Essential remaining work

The real project has no published products or category masters, so live product, featured-product, and hierarchy displays cannot be demonstrated yet. A production admin save, image upload, or admin-to-mobile publish check needs an exact user-approved noncritical record change. No live write, import, migration, upload, deletion, or deployment occurred.

## Files changed for this task

```text
existing-admin/ADMIN_UNIFICATION_REPORT.md
existing-admin/TAXONOMY_MAPPING_PREVIEW.md
existing-admin/scripts/verify-shared-catalogue.cjs
existing-admin/scripts/verify-shared-login.cjs
existing-admin/src/app/admin/merchandising/anniversary/page.tsx
existing-admin/src/app/admin/merchandising/birthday/page.tsx
existing-admin/src/app/admin/merchandising/clothing/page.tsx
existing-admin/src/app/admin/merchandising/furniture/page.tsx
existing-admin/src/app/admin/merchandising/personalised/page.tsx
existing-admin/src/app/admin/merchandising/stationery/page.tsx
existing-admin/src/app/admin/merchandising/wedding/page.tsx
existing-admin/src/app/api/admin/merchandising/[page]/items/[id]/route.ts
existing-admin/src/app/api/admin/merchandising/[page]/items/route.ts
existing-admin/src/app/api/admin/merchandising/[page]/route.ts
existing-admin/src/components/admin/AdminNav.tsx
existing-admin/src/components/admin/catalog/TaxonomyManager.tsx
existing-admin/src/components/admin/merchandising/FeaturedProductChoice.tsx
existing-admin/src/components/admin/merchandising/InlineRelationChoice.tsx
existing-admin/src/components/admin/merchandising/MerchandisingManager.tsx
existing-admin/src/components/admin/merchandising/MerchandisingPreview.tsx
existing-admin/src/components/admin/merchandising/TaxonomyPageManager.tsx
existing-admin/src/lib/catalog/mobile-projection.ts
existing-admin/src/lib/merchandising/server.ts
existing-admin/src/lib/merchandising/types.ts
existing-admin/tests/inline-merchandising.local.test.ts
packages/catalogue/src/contracts.ts
packages/catalogue/src/validation.ts
apps/mobile/e2e/shared-live-read.spec.ts
apps/mobile/src/components/visual-commerce.tsx
apps/mobile/src/domain/discovery-query.ts
```

Rollback is source-only: restore these changes or use the preserved isolated launcher for local verification. Existing Firebase records were not changed.
