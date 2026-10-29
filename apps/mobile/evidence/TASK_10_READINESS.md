# Task 10 staging readiness audit — 2026-10-25

Decision: fixture UI verification passes; cloud staging integration is NOT ready. This document is the implementation plan, not an implemented backend. No Firebase console/API, data, Auth, Storage or Admin SDK was contacted. No backend, rules, seed, payment integration or deployment was created in this task.

## Environment and repository evidence

| Check | Actual result |
|---|---|
| .env.local | Valid assignment syntax; development + fixture; ignored by Git and not tracked; no credentials copied into reports |
| Firebase identifiers | Project ID matches owner-supplied `gift4u-4210f`; auth domain matches it. Client API key and app ID present; storage bucket and messaging sender ID absent. Format/consistency inspection cannot prove API-key or app-number ownership offline |
| Existing project data | **UNVERIFIED. Treat gift4u-4210f as protected production.** Owner forbids live connection, so neither absence nor presence of live records can be confirmed. Existing archive contains product/order/auth paths, which indicates legacy integration, not proof of live contents |
| Runtime mode | `src/config/environment.ts` reads EXPO_PUBLIC_DATA_MODE using direct Expo-inlined access. Nonfixture mode throws. `liveServicesEnabled=false`; API URL reduced to a presence boolean. No Firebase initialization |
| Port 3001 | Configured private-network host TCP connect timed out, including an unsandboxed check. 127.0.0.1:3001 refused. No reachable local API established; no HTTP or Firebase data request sent |
| API source | No API server/package or Firebase project/rules configuration in supplied workspace; static preview helper is not an API. Partial read-only 13scripts ZIP is not a complete deployable backend/admin repo |
| Checkout/orders | Cart is a local preview with disabled checkout; no real checkout/orders screen or persisted server order implementation |
| Package audit | 5 high findings, 0 critical; details below |

The existing project must not be used as a convenient staging target. Adding a second mobile/web app or collection prefix to one Firebase project does not isolate Authentication, Firestore or Storage. Firebase documents that apps in one project share its services. Use a separate approved staging project. [Firebase project practices](https://firebase.google.com/docs/projects/dev-workflows/general-best-practices)

## Existing contracts and adapter gaps

`src/domain/contracts.ts` already models integer INR paise, canonical Product/Sku/Inventory, multi-department category/collection placement, SearchQuery facets, page layout, schema-driven personalization, component bundles, cart revisions, media ownership/localOnly, customer/address, preliminary order/payment and quote contracts. `domain/furniture.ts` adds validated inquiry revisions. Preserve all department-specific fields and source identities.

`services/catalog.ts` implements asynchronous CatalogService/SearchService with fixture latency/failure injection. Product/SKU/schema/template arrays are also imported directly by Home, PDP, cards, builder, category/discovery/spec panels, wishlist, cart, personalization, wedding function flow, furniture inquiry and `state/store.tsx`. Replacing only catalogService or changing DATA_MODE would leave mixed fixture/live pricing and state. A service-provider boundary and complete adapter contract tests are prerequisites.

CustomerService.signIn(name) is a demo contract, not real auth. CheckoutService only exposes availability/reason, and OrdersService is a placeholder interface. CartService validates locally. MediaService selects a local image; ownerId and localOnly are not server authorization. Order.status is an unbounded string and paymentStatus alone cannot represent reservation/capture/refund reconciliation. These need additive, versioned staging DTOs and explicit state transitions before network activation. Keep fixture behavior and current UX stable.

Read-only partial ZIP findings, to be revalidated against the full source later:

- Inventory helper reads product-level stock (`inventory.ts`, e.g. line 33), conflicting with the mobile canonical SKU authority. Do not reuse it for staging without a new SKU contract.
- Payment transaction appears to update an order before a later abandoned-cart read (`payment.ts`, update ~97, read ~111–112); this is a transaction read-order risk, not a live reproduced failure.
- Razorpay helper has a development mock fallback when unconfigured. Never accept that fallback/signature path in real staging payments.
- Checkout idempotency and raw webhook verification helpers exist, but full price/stock/captured amount/currency and failure/retry behavior cannot be established from a partial archive.
- Existing Admin SDK default initialization and roles do not establish environment isolation. No legacy helper, role, schema or admin file was changed.

## Missing prerequisites

1. Approved separate staging Firebase project ID, client app registration/config, region, Auth provider decisions and test accounts, bucket, Firestore database and service account/IAM identity. Confirm ownership through an approved console/config export without sharing secrets in chat. Current client values reference protected gift4u and must not be repurposed.
2. Full API/backend source if an existing staging service is intended, its documented routes/schema/auth, owner and an actual listening/reachable address. Otherwise use the new isolated backend below. No credentials/URL can be inferred from port 3001.
3. Approved hosting/runtime/region/billing and an HTTPS staging API/webhook origin, mobile app identifiers/signing and development-build setup. No host, tunnel, project creation, billing or deploy is authorized by this audit.
4. Razorpay merchant TEST key ID, TEST secret and separate webhook secret stored server-side, plus dashboard configuration permission and approved callback origin. No live keys. No usable test gateway configuration is present in mobile source; no provider account was queried.
5. Trusted catalogue/media and supplier facts: authoritative SKU price/stock/tax treatment, packaging charges, shipping/serviceability, refunds/returns/receipts and quote operation owners. Continue clearly labelled synthetic seeds until supplied. No ratings/promotions/ETA fabrication.
6. Supported emulator tooling and isolated Java/Node/Firebase CLI versions, to be checked locally before installation; dependency advisory resolution/triage below. Native Razorpay compatibility with Expo 58 / React Native 0.88 must be demonstrated, not assumed from a web checkout.

## Exact bounded implementation sequence

These paths and endpoint names are **proposed**, not existing services. Implement each step with its own checks/checkpoint. First work is emulator-only; cloud steps require the prerequisites above and a later explicit task.

### 10A — local isolation, contracts and read-only catalogue

Touched paths: new `apps/staging-api/**` (Node/TypeScript API, emulator config/rules, seed/test scripts), new `packages/contracts/**` (versioned HTTP DTO validation), and a narrow mobile service provider in `apps/mobile/src/services/**`, config and adapter tests. Do not change the existing admin or root production Firebase configuration.

- Use an approved **demo-prefixed local emulator project ID** with Auth/Firestore/Storage emulators. No actual ID is invented in this plan. API must require all emulator host variables, validate loopback addresses and project identity, explicitly reject gift4u-4210f, and refuse startup if one service could fall back to cloud. Do not use application-default production credentials. Tests prove missing/mixed hosts and protected project IDs fail before any request. Demo projects have no live resources, avoiding accidental fallback. [Firestore emulator guidance](https://firebase.google.com/docs/emulator-suite/connect_firestore)
- Bind local API to loopback on an available port (3001 only after listener/owner check); expose GET `/health` and `/v1/meta` returning nonsecret environment/contract/build identity. Later device LAN access needs an intentional private bind and firewall choice, not a silent base-URL replacement.
- Serve GET `/v1/catalog/categories`, `/v1/catalog/layout`, `/v1/catalog/products/:id`, `/v1/catalog/search`, `/v1/catalog/suggestions`, plus required SKU/schema/template/taxonomy data via typed DTOs. Preserve existing filter semantics, eight departments, one canonical SKU and demo markers. Never send private stock management/secrets.
- Seed only demo data into the emulator, with dry-run counts, deterministic canonical IDs, manifest/run ID, transaction checks and an emulator export for rollback. No production copy/import. Test all source family counts, same-SKU stock across categories and bundle components, inquiry-only products, paging and missing/out-of-stock items.
- Centralize all direct fixture data consumers behind selected services; keep `.env.local` fixture and fail-closed mode guard until the entire selected adapter passes equivalence tests. Do not ship mixed fixture/live cart totals.

Gate: TypeScript/lint, contract tests, emulator rules/seed/isolation tests, all mobile regression tests in fixture and the approved emulator test harness. No gateway/network dependency required. Safe rollback: revert checkpoint and reset only verified local emulator data.

### 10B — verified identity, private media and customer state

Add staging AuthService (real provider, no signIn(name) shortcut), Profile/Address/Wishlist/Cart services, private media upload-intent/completion and inquiry endpoints. Every protected request verifies token signature/issuer/audience/project/expiry and derives uid server-side; cross-user IDs must never grant access. Claims/roles belong solely to staging; no legacy roles modified.

Suggested routes: `/v1/me`, `/v1/me/addresses`, `/v1/me/wishlist`, `/v1/me/cart`, `/v1/media/upload-intents`, `/v1/media/:id/complete`, `/v1/inquiries` and revision/withdraw actions. Use cart/inquiry revision checks and idempotency, validated DTO limits and structured retryable/nonretryable errors. Store only upload asset IDs in cart/orders, not client data/file URIs. Guest merge is an explicit authenticated operation with ownership checks and deduplication.

Firestore rules deny client writes to catalogue/price/stock/order/payment state; owner-restricted profile/cart/wishlist and Storage rules are tested, or deny direct access where API owns all access. Admin SDK bypasses rules, so authorization is mandatory in API handlers as well. Validate upload owner, bytes, magic/MIME, decoded dimensions and image safety; reject oversized/decompression abuse; strip EXIF, use private paths/short-lived access and retention/abandoned-upload cleanup. Local-only assets never imply successful remote upload. Test denied permission/cancel/corrupt file/cross-user access/auth expiry/retry.

### 10C — server quote, SKU reservation and orders

Create POST `/v1/checkout/quotes`, POST `/v1/orders` with an idempotency key and GET `/v1/orders` / `/:id`. Order creation accepts SKU/component quantities, schema values/media IDs and delivery/address selections, never client payable totals. Server loads authoritative prices, currency, tax/discount validity, shipping/serviceability, packaging and stock; returns itemized paise totals, quote version/expiry and explicit unavailable/requote errors.

Represent stock by canonical SKU (`onHand`, `reserved`, version), shared by every category and kit. Flatten and aggregate bundle/component quantities multiplied by cart quantities. Validate age/schema/capacity/purchase mode server-side; quote-only furniture stays an inquiry. Read all transaction documents before writing; atomically reserve the complete order or none, recording quote versions and immutable line snapshots. Recheck price/stock on submit. No provider network request inside a Firestore retrying transaction.

Idempotency scope is uid + key + request hash: duplicate same request returns the same order; key reuse with different payload rejects. Persist order intent/reservation first; create a Razorpay TEST order with a retry/reconciliation mechanism so a timeout does not make a second payable intent. Define reservation expiry and idempotent release/capture/late-capture compensation. Explicit allowed transitions include pending-payment, payment-processing, paid, payment-failed/cancelled/expired and refund-required. Fulfilment/tracking is separate, derived from verified events and actual operations.

Test races against the same SKU (including a normal item plus bundle), final-unit oversell, stale quote, negative/overflow quantities, tampered subtotal/coupon/currency, invalid asset owner, expired reservation, API timeout after provider creation and duplicate submissions. Receipts and tracking use verified immutable orders and genuine supplier/courier state; no fake shipped statuses.

### 10D — Razorpay TEST and native checkout

Backend-only test secret/order creation. Return only the public test key ID and server-created provider order/amount/currency to the client. Refuse live credentials and mock-success fallbacks. A client success callback is pending evidence, not permission to mark paid. Verify the checkout signature with server-held order ID/secret; fetch/verify provider payment/order identity, TEST provenance, amount/currency and captured state before an idempotent paid transition. Use reconciliation for asynchronous capture/failure. [Razorpay integration flow](https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/integration-steps/)

POST `/v1/payments/razorpay/webhook` verifies the **raw** body signature using its own webhook secret, limits payload size, deduplicates provider event IDs, tolerates out-of-order events and checks order ownership/mapping. Never trust arbitrary client order IDs or signatures from local demo logic. Verify capture, failure, cancellation, duplicate delivery, replay, late events and retry without double stock release or duplicate receipts. [Razorpay webhook validation](https://razorpay.com/docs/webhooks/validate-test/)

Select/verify the supported React Native SDK/config plugin against Expo58/RN0.88 before adding it. Its official documentation could not be reliably retrieved here because of regional 404 redirects; SDK compatibility remains unresolved. Native modules require a compatible development build; Expo Go/web tests are not native payment evidence. Obtain approved test merchant credentials and an approved reachable HTTPS webhook endpoint before claiming a real gateway pass. A signed local webhook harness tests handler logic but is not an end-to-end Razorpay test. No deploy/tunnel is part of this audit.

### 10E — cloud staging activation and acceptance

Only after separate project credentials/access and explicit hosting approval: least-privilege server identity, secret manager, denied-by-default rules/indexes/Storage policy, allowed app/origin/App Check strategy, separate Auth users, private uploads, products/SKUs/carts/orders and retention/log redaction. Do not rely on collection names as the isolation boundary. Verify every SDK/token/bucket/API/project binding through an approved allowlist and health metadata, with protected-project denials.

Seed demo records using dry-run + approved staging target identity + manifest; backup/export staging before mutation and delete/restore only that run's staging records. Keep existing fixture configuration as rollback; staging payment secrets never appear as EXPO_PUBLIC values. Rotate secrets outside Git, log no tokens/address/photo contents, rate-limit sensitive endpoints and scope order/inquiry reads by verified user. Production Firebase/admin remains untouched.

Acceptance: all eight departments through server adapter; genuine staging auth failure/retry; private uploads; cart sync/price changes/stock races; test gateway failure/cancel/retry/capture, duplicate webhooks, idempotency, receipts/orders/tracking; real Android/iOS devices including slow network/background/restart. Security/rules tests and dependency audit must pass or have a specifically approved scoped resolution. Then seek Task 11 app-ready gate; no admin work before it.

## Dependency advisory status

Actual `npm audit --json` exit 1 (2026-10-25): 5 high / 0 critical. Two vulnerable packages plus three affected parent nodes, not five independent advisories:

| Installed | Advisory | Finding |
|---|---|---|
| node-forge 1.4.0 | [GHSA-86w9-cpqp-85rv](https://github.com/advisories/GHSA-86w9-cpqp-85rv) | RSA PKCS#1 v1.5 signature verification DigestAlgorithm nesting; affected <=1.4.0 |
| zod 3.25.76 | [GHSA-mrhx-c7xc-m3w5](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5) | Large constrained collections can cause excess memory use; affected <4.6.6 |

Parents reported: @expo/code-signing-certificates, @expo/cli and expo. Installed Expo 58.0.19 / CLI 58.1.15. Audit recommends Expo 44.0.6 as a major replacement, an unsuitable downgrade. No `audit fix --force`, dependency override or package/lock edit was performed. Do not infer that tooling placement makes the advisory harmless or proves mobile runtime exploitability. Next dependency task must find supported Expo/tooling patches, examine actual reachable code paths, verify SDK compatibility and rerun audit/typecheck/native compilation/regressions; separately audit any new API dependencies before activation.

## Stop boundary and next safe action

**Next assignment: implement Task 10A locally with demo-project emulators and isolated contracts/read-only catalogue, leaving current fixture mode active.** First verify emulator tooling and propose the bounded paths/dependencies before any installation. No production project query, credentials or gateway is needed for that first step. Cloud provisioning, live project inspection, backend deployment and TEST merchant integration are separate later gates. This audit stops before creating or modifying any backend.
