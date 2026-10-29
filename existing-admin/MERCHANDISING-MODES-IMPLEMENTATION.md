# P2.4 Merchandising Modes

Implemented on top of the Customer 360 fixed project.

## What changed
- Added Firestore-backed `merchandising_settings` records for `bestsellers`, `newArrivals`, and `featured`.
- Added `GET/PATCH /api/admin/merchandising-modes` with SUPER_ADMIN/ADMIN/CATALOG_MANAGER authorization.
- Added public `/api/merchandising` endpoint that resolves the active product IDs using either automatic catalog flags or manual curation.
- Added Admin → Merchandising → Merchandising Modes.
- Added automatic/manual selection, active toggle, display limit, and manual product selection.
- Updated homepage Best Sellers and New Arrivals rails to consume the resolved merchandising configuration.
- Automatic mode preserves the existing product flags; manual mode overrides the selected IDs. Only live products are returned.
- Existing product flags and bulk operations remain compatible.

## Build verification
The uploaded patch archive does not contain the root `package.json`/`tsconfig.json`, so a full production build could not be executed against this archive. Run `npm run build` in the complete local project after applying the patch.
