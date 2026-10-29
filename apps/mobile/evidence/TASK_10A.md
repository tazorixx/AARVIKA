# Task 10A — local backend and catalogue integration

Base checkpoint: 325502f. Scope: local read-only catalogue integration only. No real Firebase, emulator connection, production project query, real customer data, credentials, authentication, uploads, payments, admin changes, deployment or database migration. The user authorized an API **or** emulator-backed service; a dependency-free Node API was selected. No Firebase emulator tooling was installed or claimed tested.

## Inspected / plan

Read root/mobile AGENTS, full app-first master, category matrix/design, Task 10 readiness/visual reports, matching Task 10 backend/checkout/orders document, original source guide and relevant reference-backed catalogue data, service/domain/customer/state interfaces and customer routes. Expo58 reference, official monorepo guidance and React Native networking docs were checked. The complete current customer app is present; the legacy admin archive remains partial/read-only and was not changed.

Planned and implemented paths: `packages/catalogue/**` for shared contracts/pure demo generation/search/validation/adapters; `apps/local-api/**` for the loopback read API and integration tests; mobile service/provider/config/read consumers, launchers, tests and evidence; a private root workspace manifest for Metro. Existing original catalogue labels and business matching logic were moved/reused, not redesigned. No added package dependency, forced override or lockfile change.

## Implemented contract and behavior

- CatalogueAdapter extends catalogue/search with bootstrap, departments, filtered hierarchy, variants, individual SKU, collections and demo network controls. Existing domain contracts remain reachable through compatibility reexports. Staging adapter explicitly throws until a separate approval/verification gate.
- Success/error envelopes, contract/dataset/demo capability identity, strict loopback URL and environment guards, snapshot identity/reference and core-shape validation and resource validation. GET endpoints: health/meta, bootstrap, departments, categories/subcategories, paged product listing/search, product, product variants, SKU, collections, homepage layout and suggestions. [Route details and example query](../../local-api/README.md).
- 8 departments, 535 categories, 294 canonical products, 516 canonical SKUs, 1 demo collection, 4 schemas and 2 bundle templates. Family identities/counts, Clothing's eight paths and Furniture's 18 families/126 groups remain source-backed. Every product/inventory record remains demo-labelled. No new permanent SKU per department or combo.
- Screens, cards, filters, builder, wishlist, cart previews, personalization, Wedding and Furniture metadata now read the selected typed catalogue context. Search/PDP/home-layout calls use its adapter. No customer screen imports fixture arrays or the fixture catalogue/wedding modules. Home resolves product sections by collection reference.
- CustomerService.signIn(name) was inspected and remains explicitly a demo contract; local profile/cart/address/photo/inquiry behavior remains device-only. This task does not add customer-write APIs or imply that a profile name is authentication. Checkout stays disabled.
- Bootstrap loading/error/retry, search empty/failure/retry, missing PDP, slow/demo failure states, real HTTP timeout/abort/retry, malformed JSON/metadata/product/search response rejection, no implicit fixture fallback. PDP clears stale product state when a new request starts. Startup/recovery navigation is disabled until the catalogue and local store are ready, preventing header actions before Router mounts.
- Compact purple tokens, card/grid dimensions, navigation and reduced-motion behavior retained. Root adds a catalogue-loading boundary before local store restoration; it does not restyle customer flows.

The local server binds only to 127.0.0.1, refuses cloud/emulator/payment config, has no outbound network/client code, serves in-memory deterministic demo data and rejects write methods/remote origins/invalid Host. It never reads .env.local. The local app launcher supplies only process-level overrides, preserving fixture default and the existing environment file. `.env.example` is user-owned/untracked and was preserved.

## Verification and evidence

Actual results completed 2026-10-25 (commands from mobile unless root specified):

| Command/check | Result |
|---|---|
| `node node_modules/typescript/bin/tsc --noEmit` | Exit 0 |
| `node node_modules/eslint/bin/eslint.js .` | Exit 0, no warnings after provider dependency fixes |
| `node --experimental-strip-types --test --test-reporter=dot tests/*.test.ts` | 34 passed, 0 failed |
| Root `node apps/mobile/node_modules/typescript/bin/tsc -p apps/local-api/tsconfig.json` | Exit 0 |
| Root `node apps/mobile/node_modules/eslint/bin/eslint.js --config apps/local-api/eslint.config.cjs apps/local-api packages/catalogue` | Exit 0 |
| Root `node --test apps/local-api/tests/*.test.ts` | 7 passed, 0 failed |
| Full fixture browser suite, VISUAL_QA_STAGE=task-10a-fixture | 20 passed / 1 intentional local-only skip, final 6.0m (earlier full run 50.3s) |
| Full local API browser suite, E2E_BASE_URL=http://127.0.0.1:8082, E2E_DATA_MODE=local-api, VISUAL_QA_STAGE=task-10a-local | 21 passed, final 6.7m (earlier full run 43.0s) |
| Fixture `expo export --platform all --output-dir dist` | Exit 0, web + Android/iOS Hermes bundles |
| Local-mode process overrides + `expo export --platform all --output-dir .expo/task-10a-local-export` | Exit 0, web + Android/iOS Hermes bundles |
| Audit, `npm audit --prefix . --workspaces=false --json --cache ../../.npm-cache` through npm CLI | Exit 1, same 5 high / 0 critical; reviewed below |

Integration suite compares both adapters for all eight departments and specialist compound queries, full pagination without duplicates, exact identities/variants, source hierarchy, layouts/collections/suggestions, missing/empty responses, invalid queries, read-only/CORS/Host restrictions, unsafe config, malformed responses and real loopback HTTP timeout followed by successful retry. Browser local test injects a server-side title into bootstrap and verifies it renders, then exercises HTTP 503 bootstrap/search and retry. Fault injection is test-only; there is no publicly enabled fault or payment endpoint.

Both modes captured Home + eight departments at 320, 390, 834 and 1194 pixels: **72 audited views**, zero runtime/console errors, zero nonlocal requests, zero horizontal overflow and zero undersized visible controls under the existing audit threshold. Node client test also asserts each requested host is loopback. Fixture mode makes no API request; local mode contacts only loopback Expo/API. Package runtime source contains no Firebase/payment SDK or outbound API code. Registry/docs retrieval during development is separate from application runtime traffic.

Screenshots: `visual-qa/task-10a-fixture/` and `visual-qa/task-10a-local/` each contain 68 captures + four metrics files. [Evidence gallery](task-10a-gallery.html); [bootstrap failure](task-10a-api-error-390.png), [search recovery](task-10a-api-recovery-390.png). Representative local/fixture landing and error/recovery captures were visually checked; no styling regression found. Historical PNGs regenerated by existing tests are listed in the file manifest.

Initial corrections: moved Furniture Editor's catalogue hook into the actual editor component; narrowed environment mode; retained existing negative-age no-match semantics when centralizing validation. A Host spoof test first used fetch, which did not forward the custom Host; replaced it with a real node:http request and verified rejection. Workspace startup exposed Metro's missing root node_modules directory; the launcher now creates that empty ignored directory without installing dependencies. Restarted only verified task-owned Expo/API processes. Generated local exports under .expo were initially included by ESLint; .expo is now excluded alongside dist/evidence while all source remains linted. These failures were corrected before the passing results above.

## Dependency advisory review

Audit still reports 5 high findings from 2 underlying advisories: node-forge 1.4.0 (GHSA-86w9-cpqp-85rv) and zod 3.25.76 (GHSA-mrhx-c7xc-m3w5), propagated through Expo CLI/code-signing/expo. Read-only registry checks show Expo 58.0.19 is the latest stable SDK58 patch, node-forge latest is still 1.4.0, and Zod latest 4.6.7 clears the reported <4.6.6 range. Installed Expo CLI explicitly requires node-forge ^1.4.0 and Zod ^3.25.76; certificate helper also requires node-forge ^1.4.0. A forced Zod4 override breaks the declared major-version contract, and audit's Expo44.0.6 downgrade is unsuitable. No forced fix/downgrade or dependency edit was applied.

The new local API/shared package add **zero external runtime dependencies** and do not use forge/Zod. Expo CLI uses these for tooling/dev-tools/code-signing; this observation does not prove all exploit paths unreachable. Advisories remain open and block a security-clean release claim. Track supported upstream patches, then verify compatible updates with native/bundle/regression checks. [Forge advisory](https://github.com/advisories/GHSA-86w9-cpqp-85rv), [Zod advisory](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5).

## Files / launch / rollback

The [exact file manifest](TASK_10A_FILES.txt) records all created/modified/moved paths, including source JSON relocated to the shared catalogue without label changes. Root package.json adds only private workspace metadata/check commands; mobile package.json changes launcher scripts only. Mobile package-lock, app styling tokens/config, admin and environment files were not modified.

Launch backend from root with `node apps/local-api/src/index.ts`; launch local API web from mobile with `node scripts/start-local-api.cjs` (8082). Default fixture web: `node scripts/start-expo.cjs --web --offline --port 8081` (8081). [Full instructions](../../local-api/README.md). Ctrl+C stops each process. Revert the Task 10A checkpoint and use fixture mode to roll back. No remote/data rollback exists because nothing was written remotely.

## Remaining limits and precise Task 10B prerequisites

- Browser viewports are not native device evidence. Neither adb nor an emulator is available here; no Android/iOS binary/device run or native HTTP success is claimed. Hermes compilation passes only establish bundle validity. A device/simulator with appropriate loopback forwarding (e.g. Android adb reverse for 3001), approved app IDs/development build, platform-scoped HTTP development configuration and actual native networking/redirect/keyboard/accessibility/background QA are still needed. Physical-device LAN access and global cleartext exceptions were deliberately not enabled. [React Native networking restrictions](https://reactnative.dev/docs/network).
- Full snapshot bootstrap (~1.73 MB) is suitable for this bounded local demo, not a production scale/read freshness solution. Real catalogue asset loading, incremental APIs, cache/version invalidation and private/customer writes remain future work. All prices, stock, images and supplier/delivery facts remain demo/unverified; stock reservations/quotes/orders/payments are absent.
- Existing `gift4u-4210f` data status remains **unverified/protected**. No project inspection or migration was done. Do not reuse it for Task 10B.
- Before real Firebase work: a separate explicit verification/approval gate plus an approved **separate staging project** ID, client registrations/app IDs, Auth provider/test-account decision, bucket/database/region, server identity/IAM and secret handling. Supply configuration through private environment channels; no invented IDs or credentials. Decide authorized API host/origin and hosting/billing/deployment scope separately. For emulator-only 10B, first approve the local demo-project identity and install/verify Auth/Firestore/Storage emulator tooling; this API has no emulator rules tests yet.
- Task 10B must implement verified AuthService (replace demo-name sign-in), user-bound profile/address/wishlist/cart APIs, revision/idempotency/guest-merge rules, owner-private upload intent/completion and validated furniture inquiry persistence. Plan/test denied-by-default rules and server authorization because Admin SDK bypasses rules. Validate file contents/bytes/dimensions/ownership, private access, retention and cross-user denial; local URIs must not become upload proof. Keep fixture fallback as an explicit selected mode only.
- Resolve/triage the remaining dependency advisories with supported versions before cloud/release acceptance. Define sample-only staging seed/export/dry-run/rollback and security/emulator contract tests. **No payment credentials or payment processing is needed for Task 10B**; secure server pricing/reservations/Razorpay TEST belongs to subsequent separately approved work.

Task 10A stops here. Do not activate staging, access real Firebase, deploy, implement payments or modify the existing admin based on this checkpoint.
