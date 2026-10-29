# P1.1 — Delivery Zones

Implemented without replacing the existing product-level delivery engine.

## What changed

- Added `delivery_zones` Firestore model and admin CRUD.
- Added `Admin → Delivery Zones` for SUPER_ADMIN, ADMIN and ORDER_MANAGER.
- Zone coverage supports pincodes and cities.
- Zone rules support minimum/maximum days, same-day, midnight, base fee, cutoff hour, holidays, per-slot fees and per-slot capacity.
- Existing product delivery rules remain the fallback.
- Product editor now has `Use delivery-zone defaults` under Delivery. New products default to zone inheritance; legacy products remain unchanged until saved/migrated.
- Checkout delivery validation resolves the selected pincode to an active zone and applies zone defaults for products using zone inheritance.
- Final order creation repeats the zone resolution and validation server-side.
- Product detail delivery checker now uses the same public availability endpoint, so customer-visible delivery options can match checkout rules.
- Public delivery availability is rate limited.
- Delivery zone create/update/delete operations are written to the existing admin audit log.
- Existing transactional product/slot capacity reservation remains in place; zone slot capacities feed that same mechanism.

## Important compatibility behavior

Products with no `delivery.zoneMode` remain legacy/fallback products in Firestore. They are not silently changed by adding a delivery zone.

Products with `delivery.zoneMode: "inherit"` receive active zone delivery defaults when their pincode matches a zone. Product-level values remain the fallback when no matching zone exists or the zone is not configured to override product delivery.

## Testing limitation

The uploaded source archive did not contain `package.json`/`node_modules`, so a real `npm run typecheck` / `npm run build` could not be executed against this archive. The modified TypeScript/TSX files were syntax-checked with the available TypeScript compiler; unresolved module errors are expected because dependencies and the project tsconfig were not present in the uploaded archive.
