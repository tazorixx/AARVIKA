# Gift4U — Phase 1 Status

## Scope completed in this working artifact
- Firestore catalog collections: categories, occasions, recipients, collections, products, inventory, slugs.
- Server-side slug locks with transactional reservation and rename handling.
- Catalog API routes with independent Firebase ID-token + role checks.
- Inventory mutation restricted to SUPER_ADMIN / ADMIN.
- Admin taxonomy pages and product create/edit pages.
- Public catalog API backed by live Firestore data.
- Home category/product/recipient/new-launch rails now consume Firestore catalog data instead of component hardcoded catalog arrays.
- Idempotent catalog seed script preserving the original Phase 0 product examples plus the existing new-launch examples.
- Firestore client writes remain denied; public reads are limited to active taxonomy and live products.
- ImageKit upload endpoint keeps the private key server-side and returns uploaded ImageKit URLs.

## Important implementation note
The build environment used for this artifact could not complete `npm install` because the npm install process timed out before dependencies were downloaded. Therefore a real `npm run build` could not be completed here and is intentionally NOT reported as passed.

## ASSUMPTION:
Marketing-only arrays that are not catalog entities (for example static budget labels, age-group copy, and navigation/help links) remain local because Phase 1 is limited to the Firestore catalog model. Product/taxonomy arrays used by the main home catalog rails were removed from those components. Remaining category/occasion page migrations should be handled as part of the page-specific catalog experience work rather than silently changing unrelated UX in Phase 1.

## ASSUMPTION:
ImageKit credentials are not embedded in source. Set `IMAGEKIT_PUBLIC_KEY`, `IMAGEKIT_PRIVATE_KEY`, and optionally `IMAGEKIT_URL_ENDPOINT` in the local environment before using uploads.
