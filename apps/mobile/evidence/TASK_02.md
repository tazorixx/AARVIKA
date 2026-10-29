# Task 02 — shared discovery

Inspected: Task 02, category matrix/design guidance; catalogue PDF all 10 pages, supplied Clothing/Birthday/Anniversary/Furniture maps and partial catalogue contracts (read-only). Typed domain/service contracts created before department-specific UI.

Changes: src/domain/contracts.ts; src/services/catalog.ts and taxonomy.json (247 categories, exact 10/11/9 PDF families and child labels); shared ProductArt/Card/Grid/Specs and CatalogBrowser; config-driven home; department/category/search/PDP routes; builder destination; catalogue unit/browser tests. Demo price/stock/design labels everywhere. Artwork is illustrative, not merchant photography. Leaf placements reference canonical products and ancestor categories. SKU prices use integer paise. No stored schema/admin/backend changes.

Checks:
- TypeScript fixture inference failures fixed; final `node node_modules/typescript/bin/tsc --noEmit`: exit 0.
- Effect lint issues fixed; final `node node_modules/eslint/bin/eslint.js .`: exit 0.
- `node --experimental-strip-types --test tests/*.test.ts`: 4 passed, 0 failed.
- Browser catalogue and shell suites: 2 passed after refreshing Metro (initial stale bundle and startup connection failures corrected). Search → SKU PDP → alternate size → back restores query; budget empty result, clear filters, missing product; eight department navigation; no page errors in shell suite.
- 320/390 home screenshots captured, 390 reviewed; no horizontal overflow. Earlier shell screenshots retained.

Limits: no native device evidence; generic discovery foundations do not complete Tasks 06–09. Empty catalogue branches are honest empty states. Auth/cart and builder actions intentionally unavailable until their authorized subsequent tasks. Existing admin untouched.

Rollback: revert Task 02 checkpoint. Next: Task 03 persistent demo customer/wishlist/cart. Browser/type/lint/unit gate passed.
