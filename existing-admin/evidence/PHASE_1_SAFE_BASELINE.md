# Phase 1 — copied admin isolation and baseline

Scope: `existing-admin` copy only, plus root Git protections. Original Gift4U folder was not inspected or modified. No branding/layout edits or mobile catalogue contract changes in this phase.

## Source and credentials

- Original copied source checkpoint: `ab5d820`, branch `app/admin-emulator-integration`; mobile baseline `20d2488`.
- 438 copied files inspected; manifest/lockfile agree. No recognized production credential patterns, private-key files, populated environment files or inherited Firebase/provider credentials found. Synthetic `.invalid` emulator accounts are deliberately defined by the seed script and are not real credentials.
- Existing `.firebaserc`, Firebase project identifiers and deployment configuration preserved. They are not used by isolated launch commands.
- Git ignores environment files, dependencies, builds, credentials, emulator state/logs and project-local Java/emulator binaries. User-owned mobile `.env.example` remains untouched.
- Installed 1,097 packages with existing lockfile, `npm ci --ignore-scripts --no-audit --no-fund --workspaces=false`; dependency versions unchanged. Initial sandbox registry `EACCES` required a permitted retry. Lifecycle scripts were not blindly executed.

## Isolation implementation

- Only project `demo-aarvika-local` is accepted. Auth `127.0.0.1:9099`, Firestore `127.0.0.1:8080`; hub/logging/websocket confirmed on loopback.
- Firebase server/client initialization rejects absent/incorrect isolation flags, other project IDs, wrong hosts, production credentials and provider keys. Server certificate/file fallback removed from this copy. Existing role verification remains.
- Client explicitly connects both SDKs to the emulators before use. Server uses emulator environment variables and no service account.
- Process-only launchers refuse `.env` files and inherited non-demo project settings. No owner environment file was overwritten.
- Real upload, payment and order-placement routes are disabled; server fetch refuses external HTTP destinations and redirects. Existing provider code/UI is retained, with no provider configured or contacted. Legacy cloud bootstrap/verification scripts are blocked before loading credentials; synthetic users use the guarded seed script.
- Installed Microsoft Java 21.0.12 locally under ignored `.tools`, verified against the publisher's SHA256. System Java 17 and system PATH were not changed. The locked Firebase CLI requires Java 21.
- Official setup references: [Firestore emulator](https://firebase.google.com/docs/emulator-suite/connect_firestore), [Auth emulator](https://firebase.google.com/docs/emulator-suite/connect_auth). Next.js 16.3.4's installed guides were read before changing its runtime initialization.

## Baseline repairs without redesign

Initial TypeScript passed. Initial lint had 61 errors / 98 warnings; the full existing unit suite had 139 passed / 9 failed.

- Deferred initial effect-triggered state updates, removed nested sidebar component remounting, corrected render-time clock handling and navigation assignment, added API display types and corrected two constant declarations. JSX structure, CSS, spacing, fonts, icons and routes retained.
- Repaired stale tests against the already-existing packed/out-for-delivery lifecycle, notification templates and delegated transaction/pricing helpers. Added checks preventing skipped fulfillment states. Corrected one inconsistent low-stock test fixture (six available units was incorrectly expected under a five-unit threshold).
- Removed a duplicate `shipped` entry in the existing customer status array. No payment, courier or order-processing integration was implemented.

## Actual verification

- Admin TypeScript: exit 0 (`tsc --noEmit --incremental false`).
- Admin lint: exit 0, zero errors; 98 existing warnings retained and reported.
- Existing admin and new isolation unit tests: 148 passed, zero failed.
- Firestore rules against the demo emulator: 5 passed, zero failed; direct client writes denied even for CATALOG_MANAGER.
- HTTP isolation: anonymous access denied, SUPPORT writes denied, owner demo reads succeed, emulator token audience checked, ImageKit disabled, order placement disabled (6 logical checks).
- Isolated optimized Next.js build: passed. Existing middleware deprecation warning retained; no unrelated middleware redesign/migration.
- Original baseline: 20 actual desktop/mobile captures in `before/`. Post-repair baseline: 20 in `isolated-baseline/`. No page errors or external browser requests. Sidebar, navbar and content-column geometry is identical in every corresponding measured view.
- Mobile TypeScript/lint: passed; unit tests 36 passed. Mobile browser suite: 20 passed, 1 intentional local-API skip (1.9m). First attempt could not reach the stopped preview server; the clean rerun passed after starting it.
- Mobile Android/iOS/web export passed (`.expo/admin-phase1-export`); existing local API integration tests: 7 passed, zero failed.

## Local commands

From `existing-admin`:

```powershell
node scripts/run-isolated.cjs emulators
# In a second terminal, once both emulators are ready:
node scripts/seed-isolated.cjs
node scripts/run-isolated.cjs dev
```

Admin: `http://127.0.0.1:3100/admin/login`. Only synthetic local accounts from `seed-isolated.cjs` are supported. Do not use real account details.

```powershell
node scripts/test-isolated.cjs
node scripts/test-isolated.cjs --rules
node scripts/verify-isolated-http.cjs
node scripts/run-isolated.cjs build
node scripts/capture-admin.cjs isolated-baseline
```

Rules tests clear demo database records; rerun the synthetic seed afterward. No cloud commands are exposed by the isolated launcher. Emulator state is disposable.

Rollback: stop copied-admin/emulator processes before reverting the phase checkpoint. `ab5d820` preserves the untouched source, but does not contain the new isolation guards and must not be started against real Firebase. Original project and live data require no rollback.

Next: department-aware additions to the existing ProductEditor/TaxonomyManager and canonical SKU contracts. Keep fixture/local API compatibility and the original admin template.
