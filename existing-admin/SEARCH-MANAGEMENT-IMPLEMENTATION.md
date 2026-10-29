# P2.1 Search Management

Implemented on top of the existing Gift4U catalog.

## Customer search
- `/api/search?q=` performs server-side search over live products.
- Searches are normalized and rate-limited.
- Synonyms expand matching terms.
- Active pinned products can be promoted for a query.
- Search events are stored in `search_queries` for analytics/no-result demand.
- Search results still use the existing Gift4U product cards and sorting UI.

## Admin
- New `Admin -> Marketing & Discovery -> Search` page.
- Synonyms: create/delete.
- Redirects: create/delete.
- Pinned products: create/delete.
- Search demand table: search count and zero-result count.
- Admin access limited to SUPER_ADMIN, ADMIN and CATALOG_MANAGER.

## Firestore collections
- `search_synonyms`
- `search_redirects`
- `search_pins`
- `search_queries`

## Compatibility
- Existing catalog pages and product data remain unchanged.
- Empty `/search` browsing still uses the existing catalog hook.
- Existing product-level sorting remains available.
- No existing catalog records are migrated or deleted.

## Validation note
This archive does not include the complete package/build environment, so a full `npm run typecheck`/`npm run build` was not executed here.
