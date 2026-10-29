# AARVIKA — copied admin and mobile integration

Final verification: 26 October 2026. Branch: `app/admin-emulator-integration`.

## Scope and safety

Implemented the six assigned phases in the copied `existing-admin/`, existing mobile app, shared catalogue and local development tooling. The original Gift4U folder was not accessed or modified. No production Firebase access, production credentials, database migration, deployment, payment processing, courier or SMS integration was performed.

Read the root/admin AGENTS, preservation V2 plan, admin/app master, Tasks 12/13, Task 10A evidence, existing source and installed framework guidance. V2 template preservation and the explicit approval to work on the copy govern this implementation.

The original copied source was checkpointed at `ab5d820` before implementation. It was not safe to start unchanged: client/server Firebase initializers could use cloud configuration. Isolation was implemented before running the admin. Only `demo-aarvika-local`, loopback Auth `9099` and Firestore `8080` are accepted. Client and server reject wrong projects, hosts, missing isolation flags and provider credentials. Server fetch allows loopback only; redirects are rejected. Upload, payment and order-placement endpoints are disabled. Original Firebase IDs and `.firebaserc` are preserved but unused by the guarded commands. Environment files, generated builds, dependencies and emulator state are ignored by Git. The mobile `.env.local` remains unchanged in fixture mode; the owner's untracked `.env.example` remains untouched.

The copied source credential scan found no recognized production credential/private-key patterns or populated copied-admin environment files. Synthetic `.invalid` accounts in the guarded seed are local test fixtures. Secret values and tokens were not printed in reports. Existing lockfile installation was used without dependency version changes; workspace-local Java 21 supports the locked emulator CLI without changing system Java.

## Implemented phases

### 1. Safe baseline

Confirmed the complete Next.js admin source: 438 copied files, 285 source files and 39 admin pages. Installed from its existing lockfile, added guarded emulator/dev/build/start/test/seed entry points and captured the original template before branding or feature work. Fixed confirmed existing lint and stale-test failures without replacing components or order workflows. Existing reserve/sold semantics and role checks were retained. Detailed baseline: [PHASE_1_SAFE_BASELINE.md](PHASE_1_SAFE_BASELINE.md).

### 2. Existing product management

Extended `ProductEditor.tsx` and its existing controls. Added eight department selections, searchable Main/Sub/Child placements, applicable product fields, local image references, immutable canonical SKU identities, unique variant combinations/codes, per-SKU prices/stock, publication validation and unsaved-change protection. Drafts can be incomplete; publishing validates the complete product. Preview has keyboard focus trapping/restoration and Escape support. Accepted navigation prompts once; cancelled sign-out preserves edits and session. Existing personalization, variant and delivery parser handling remains intact.

Stock changes use revision checks and reasoned adjustment history. Reserved/sold units cannot be overwritten by client values, removed or reassigned through a variant rewrite. Legacy product inventory is a compatibility projection for managed products, not a second stock pool. Bulk operations cannot bypass canonical validation or managed SKU stock. Detailed authoring evidence: [PHASE_2_PRODUCT_AUTHORING.md](PHASE_2_PRODUCT_AUTHORING.md).

### 3. Department configuration

| Department | Added configuration retained through API/mobile projection |
| --- | --- |
| Wedding | Culture, region, ceremony IDs and component-backed kits |
| Birthday | Recipient, age range, budget/discovery values and interests |
| Personalized Gifts | Typed photo/text/engraving/choice schemas, required fields and limits |
| Anniversary | Milestones, years and recipients |
| Hampers | All ten source families, component SKU references, packaging, eligibility and quantity/capacity constraints |
| Clothing | Size, fit, colour, fabric, size guides and canonical variant stock |
| Stationery | All eleven source families and product-type specifications |
| Furniture | Home/Commercial families, dimensions, materials, finishes, custom instructions and inquiry mode |

Seed data includes all 535 expanded source catalogue categories and sixteen existing fixture designs; reseeding preserves existing product and category edits. Kits derive demonstration prices/availability from component SKUs and packaging; they do not create independent stock. Nested, missing, inactive or incompatible components are rejected. Unrelated departments are not forced to provide Wedding/Birthday fields. Existing Lifestyle admin functionality remains; no ninth mobile department was added.

Furniture inquiry review/history is a compact disclosure inside existing Support. Existing Support permissions are retained; catalogue managers and anonymous users are denied. Internal demo quote changes are revision checked and recorded in immutable history. Nothing is sent to a customer and no payment/order is created. Mobile customer inquiries remain device-local; only synthetic seeded requests were reviewed in the admin. Detailed configuration: [PHASE_3_DEPARTMENT_CONFIGURATION.md](PHASE_3_DEPARTMENT_CONFIGURATION.md).

### 4. Existing homepage editor

Extended the current editor, form, section cards and preview. Supports existing hero/banner/text/link sections plus typed categories, product sources and collections; reorder/visibility, saved drafts, preview, publishing, immutable version history and rollback. A rollback publishes a new version. Stale writes are rejected and controls wait for the authoritative version. Unsupported best-seller ranking is disabled/rejected rather than inventing sales. Homepage data changes require no mobile source edit. Detailed checks: [PHASE_4_HOMEPAGE.md](PHASE_4_HOMEPAGE.md).

### 5. Versioned catalogue integration

Shared additive v2 contracts live in `packages/catalogue/src/admin-contracts.ts`. Read-only `GET /api/mobile/v2/catalog` projects explicitly published, managed admin records. The response identifies the demo project, emulator-only Firebase, disabled payments and device-only customer data. Legacy records without explicit mappings remain outside public discovery.

- Product IDs are retained; SKU IDs are stable and authoritative. One product may appear in multiple departments/categories/collections.
- Admin rupees convert to integer paise once at authoring; canonical SKU quantity minus reservations determines demo availability.
- Publication, three-level taxonomy, collection ordering, local media, personalization, size guides and homepage versions map explicitly. Private admin category metadata is not exposed.
- Mobile's opt-in `admin-emulator` adapter accepts only `http://127.0.0.1:3100`; it bounds timeout/response size, validates snapshots, rejects redirects and foreign metadata, and implements typed search/filter/pagination methods.
- Changed snapshots refresh open listings/PDPs and homepage sections. Changed prices, sold-out variants, unpublished products and unavailable cart lines have working states. Failures retain the last labelled demo snapshot and expose retry.
- Fixture default and the existing v1 local API remain functional. No direct mobile Firebase calls were added. Auth, cart, wishlist, addresses, photos, personalization drafts and order review remain device-local DEMO functionality.

Detailed integration: [PHASE_5_MOBILE_INTEGRATION.md](PHASE_5_MOBILE_INTEGRATION.md).

### 6. Template preservation and final verification

Existing sidebar, navbar, dashboard, cards, tables, fonts, spacing, icons, forms, routes and unrelated functional pages remain. AARVIKA replaces appropriate visible storefront labels; accent changes use `#62298E`, `#3E155C` and `#E9DDF7`. Error/destructive colours remain meaningful. The public website was not redesigned. Fixed malformed navigation glyphs and excluded inquiry-only Furniture/component kit parents from independent-stock alerts. Original lifecycle/provider code remains present, with external execution disabled in this isolated environment.

## Actual test results

Final transcripts are in [final-results](final-results/). Commands below are relative to their stated working directory. Browser scripts use the existing mobile Playwright/installed Chrome tooling and guarded loopback services.

| Working directory / command | Result |
| --- | --- |
| `existing-admin`: `node node_modules/typescript/bin/tsc --noEmit --incremental false` | Passed; optimized build also completed TypeScript checks |
| `existing-admin`: `node node_modules/eslint/bin/eslint.js .` | 0 errors, 97 existing warnings |
| `existing-admin`: `node scripts/test-isolated.cjs` | 158 passed, 0 failed |
| `existing-admin`: `node scripts/test-isolated.cjs --rules` | 7 passed, 0 failed; expected permission-denied diagnostics |
| `existing-admin`: `node scripts/run-isolated.cjs build` | Optimized Next.js build passed |
| `existing-admin`: `node scripts/verify-isolated-http.cjs` | 6 isolation/role/disabled-provider checks passed |
| `existing-admin`: `node scripts/verify-authoring.cjs` | 39 authoring/inventory/role checks passed |
| `existing-admin`: `node scripts/verify-homepage.cjs` | 20 publish/history/rollback checks passed |
| `existing-admin`: `node scripts/verify-mobile-integration.cjs` | 22 create/publish/edit/unpublish/taxonomy/homepage checks passed |
| `existing-admin`: `node scripts/verify-inquiries.cjs` | 9 HTTP checks plus actual browser review/history/dynamic mobile-family persistence passed |
| `existing-admin`: `node scripts/verify-editor.cjs` | Editor, dirty navigation, preview keyboard/focus and draft browser checks passed at 390px |
| `existing-admin`: `node scripts/verify-homepage-browser.cjs` | Draft, publish and rollback browser checks passed at 390px |
| `existing-admin`: `node scripts/verify-mobile-browser.cjs` | Product/homepage edits, price/stock/cart, unpublish, offline/retry, reduced motion and all eight departments passed; 30 screenshots at 320/390/768px |
| `existing-admin`: capture scripts and metrics comparison | 22/22 original admin shell geometries preserved; login geometry/fonts identical at both widths; 0 observed runtime errors/external requests |
| `apps/mobile`: TypeScript, ESLint | Both passed, no lint errors/warnings |
| `apps/mobile`: `node --experimental-strip-types --test tests/*.test.ts` | 40 passed, 0 failed |
| `apps/mobile`: existing Playwright fixture suite against local preview, excluding screenshot-only capture suites | 20 passed; 1 intentional local-API-mode skip |
| `apps/mobile`: Playwright `e2e/local-api.spec.ts` in local API mode | 1 passed |
| Workspace: existing local API TypeScript/ESLint and `node --test apps/local-api/tests/*.test.ts` | Passed; 7 integration tests, 0 failed |
| `apps/mobile`: Expo `export --platform all` in fixture mode | Android, iOS and web passed; output `dist` |
| `apps/mobile`: same export with process-only admin-emulator environment | Android, iOS and web passed; output `.expo/admin-emulator-export` |

Rules tests clear the disposable demo database; it was reseeded before subsequent integration/browser checks. Earlier failed attempts and fixes remain in diagnostics/history: loading-state captures, login hydration, a premature homepage version and browser selector ambiguities were corrected, then applicable checks rerun. Historical phase reports record their then-current counts; this table records final results. No outstanding critical failed test is being represented as passed.

## Screenshots and exact changed files

- [Actual original/verified comparison gallery](ADMIN_MOBILE_COMPARISON.html): 24 before/after pairs, Support inquiry review and 30 mobile screenshots.
- `before/`, `before-support/`, `before-login/`: original screenshots.
- `verified-admin/`, `verified-login/`: final captures; `inquiries/`: open internal review controls; `mobile-emulator/`: loaded integration screens.
- [Exact tracked changed-file manifest](ADMIN_APP_CHANGED_FILES.txt). The initial copied source checkpoint is distinguished from implementation edits; ignored dependency/build/emulator artifacts are not source changes. The owner's untracked mobile `.env.example` is excluded.

## Run locally

From `existing-admin`, terminal 1:

```powershell
node scripts/run-isolated.cjs emulators
```

From `existing-admin`, terminal 2 after both emulators are ready:

```powershell
node scripts/seed-isolated.cjs
node scripts/run-isolated.cjs dev
```

Open `http://127.0.0.1:3100/admin/login`. Use only the synthetic local accounts defined by the seed script, never real account details. Seed is non-destructive for existing demo product/category edits; rules tests deliberately clear the disposable demo database.

From `apps/mobile`, terminal 3:

```powershell
node scripts/start-admin-emulator.cjs
```

Open `http://127.0.0.1:8084`. This opt-in changes the process environment, not `.env.local`. For the default fixture app use `node scripts/start-expo.cjs --web --offline --port 8081`. Existing local API mode uses workspace `node apps/local-api/src/index.ts` plus mobile `node scripts/start-local-api.cjs` (8082). Port conflicts mean an earlier local session may still be running; reuse or stop only that known session.

## Remaining issues and safe next steps

1. Android SDK/emulator tooling and two configured AVDs are available, but there were zero running/connected devices. No native app was installed or run. Android/iOS exports do not prove device behaviour; iOS native runtime cannot be tested on this Windows host. Next safe work is isolated native Android QA for keyboard, focus, persistence, navigation and network recovery. The hard-coded numeric loopback development adapter is for this host's browser; device/emulator connectivity needs an explicitly isolated development bridge before claiming native integration.
2. Existing 97 lint warnings and Next middleware deprecation remain. Dependency versions/lockfile were not changed. Historical high-severity advisories recorded in Task 10A remain unremediated; this is not a fresh security-clearance claim. Remediate with a separate compatibility-tested dependency task rather than an Expo downgrade or blind major override.
3. Real customer synchronization, upload storage, production auth, pricing/checkout/order processing, payments, courier/SMS and staging/production integration remain excluded. Furniture quote review is internal demo-only. No fake successful real order or payment was introduced.
4. The snapshot adapter and full demo catalogue were verified locally; large-catalogue performance, load/concurrency limits and production media delivery were not certified. Admin-created published records require explicit v2 metadata; legacy bulk migration needs a separately reviewed dry run and rollback.
5. Keep all isolation guards during rollback. Feature checkpoints are listed in Git history. Do not launch the untouched `ab5d820` source checkpoint against cloud settings. Any future staging backend requires a separate credential/project-isolation, rules, data-contract and approval gate. No external integration or deployment is the next automatic step.
