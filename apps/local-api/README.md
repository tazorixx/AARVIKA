# AARVIKA local catalogue API — Task 10A

Read-only, in-memory **demonstration** catalogue. Node 24.19.0 was used for verification. No Firebase SDK, emulator, database, credentials, customer records, payment SDK or external runtime dependency. The existing reference project is never a target. All prices/availability are demo values and cannot be used for checkout.

From the repository root:

```powershell
node apps/local-api/src/index.ts
```

Listens on **http://127.0.0.1:3001** only. `LOCAL_API_PORT` may select another unused port. Startup refuses Firebase/cloud credential/emulator/payment configuration and nonloopback binding. It does not read .env files. Restart reconstructs the same deterministic demo records; nothing is saved to disk or a database. No seed/import/migration action or Firebase project ID is required.

For the customer app, in a second terminal:

```powershell
cd apps/mobile
node scripts/start-local-api.cjs
```

Opens Expo web on **http://localhost:8082** with process-only `development`, `local-api` and `http://127.0.0.1:3001` overrides. The script does not edit .env.local. Default fixture development remains:

```powershell
cd apps/mobile
node scripts/start-expo.cjs --web --offline --port 8081
```

`npm run web:local` and `npm run web -- --offline --port 8081` are equivalent. Root workspace metadata allows Metro to load shared source; the launcher creates an empty ignored root node_modules directory required by its workspace file map. No packages are installed. Existing mobile dependencies and package-lock remain the install authority; if missing, use the existing locked mobile install (`npm ci --prefix apps/mobile --workspaces=false`) in an authorized dependency-install task. No root dependency installation was performed for Task 10A.

Local API mode is accepted only for development/test and a numeric IPv4 loopback URL with an explicit port. LAN, cloud, userinfo, path and query URLs are rejected. Fixture mode ignores the preexisting private API URL in .env.local. Staging mode is an explicit disabled adapter extension; it cannot be enabled by changing a URL.

## Contract v1

Success: `{ "meta": CatalogueMeta, "data": T }`. Metadata identifies `aarvika-local-demo-v1`, `environment: local`, `demo: true`, and `firebaseEnabled/paymentsEnabled: false`. Errors: `{ "error": { "code", "message", "retryable" } }` with an HTTP status. Responses are JSON, no-store and nosniff. Only GET/OPTIONS; local browser origins only; no cookies or credentials.

| GET route | Data |
|---|---|
| `/health`, `/v1/meta` | Safe environment/capability metadata |
| `/v1/catalog/bootstrap` | Versioned canonical snapshot: all eight departments, catalogue, schemas, templates, source browse metadata and layout |
| `/v1/catalog/departments` | Eight active department records |
| `/v1/catalog/categories` | Categories; optional `departmentId`, `level=1/2/3`, `parentId` (`null` for roots) |
| `/v1/catalog/products`, `/v1/catalog/search` | SearchResult, optional URL-encoded JSON `q` |
| `/v1/catalog/products/:id` | Product or null |
| `/v1/catalog/products/:id/skus` | Product's canonical variant list (empty for missing/inquiry-only) |
| `/v1/catalog/skus/:id` | SKU or null |
| `/v1/catalog/collections` | Collection IDs and canonical product references |
| `/v1/catalog/layout` | Versioned homepage sections |
| `/v1/catalog/suggestions?text=...` | Product/category/tradition/function suggestions |

Example:

```powershell
$query = [uri]::EscapeDataString('{"departmentId":"clothing","attributes":{"Audience":"Women","Size":"M","Colour":"Blue"},"inStockOnly":true,"limit":10}')
Invoke-RestMethod -Uri "http://127.0.0.1:3001/v1/catalog/search?q=$query"
```

SearchQuery retains text, department/category, recipient, age/year, interest, budget in integer paise, colour/material/occasion, product type, personalization/hamper/verified delivery, collection, type-specific specification attributes and dimensions, in-stock/include-unpriced, sort, cursor and limit. Unknown fields/type errors are rejected. `limit` is 1–100; nextCursor is an opaque-to-the-client offset string. Missing product uses null; no matches uses an empty list. Existing invalid age/year matching behavior is preserved (no matches); no new merchant rules were added.

One canonical record per product/SKU; departments/collections are references, not copied stock. The snapshot is ~1.73 MB in this demo. Full bootstrap is a deliberate bounded local foundation so existing facets, builders, cart previews and wedding metadata all use the selected source. Production-scale incremental loading, data revisions and remote cart authority require later design; this snapshot is not a checkout quote or reservation.

## Adapters and failures

`packages/catalogue/src/api-contracts.ts` defines CatalogueAdapter extending existing catalogue/search interfaces. Fixture and HTTP adapters use the same pure search engine/data contract. HTTP mode never falls back to fixture data. `CatalogueProvider` loads/validates one selected snapshot before mounting customer flows. Components get SKUs/categories/schemas/templates from this typed cache; asynchronous search/PDP/home layout reads use the selected adapter. Old mobile fixture exports remain only for domain test compatibility. Customer profile/cart/inquiry/media writes stay explicitly local demos, not HTTP auth or uploaded content.

HTTP requests have a 5-second timeout/abort, bounded query/response sizes, metadata/data validation and redirect rejection in tested web/Node fetch. Errors show loading/error/empty/retry states without reusing stale PDP data. Account's existing demo network controls remain labelled simulations; integration tests separately exercise actual loopback timeout/retry and malformed/HTTP failure responses. Native fetch behavior and platform HTTP exceptions still need device verification; see the task report.

## Verification

From root: `npm run test:api`, `npm run typecheck:api`, `npm run lint:api`. They use the existing mobile TypeScript/ESLint tools and built-in Node test runner. Mobile: typecheck/lint/unit commands in its package; browser suite defaults to fixture. For local browser regression set `E2E_BASE_URL=http://127.0.0.1:8082` and `E2E_DATA_MODE=local-api` in the test process. No production or gateway test belongs here.

Stop both terminal processes with Ctrl+C. Rollback: revert the Task 10A checkpoint and launch fixture mode. There is no database rollback. Do not expose this local service publicly or treat it as an authenticated backend.
