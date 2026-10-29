# AARVIKA mobile visual and functional completion

Date: 25 October 2026. Scope: existing customer app, fixture and existing isolated local API modes. This is a local demo UI completion checkpoint, not production/staging app-ready approval. No external integrations, payments, Firebase, admin changes, deployments, dependency changes or catalogue migrations.

## Inspected

Read root/mobile AGENTS.md, master requirements, CATEGORY_FEATURE_MATRIX.md, DESIGN_AND_MOTION.md, existing source/contracts and browser/unit tests. Visually inspected all six supplied references: purple home, Clothing/Anniversary/Birthday references, alternate Birthday and Furniture master map. The existing three-level catalogue and specialized department models remain intact.

Before captures were taken from the actual running Expo app before edits. After captures also use the running app, not design mockups. [Open the local before/after gallery](polish/index.html); it links 320, 390, 430, 834 and 1194px captures. There are 171 before PNGs and 181 after PNGs, including end states and new local-review/sheet screens. All 145 measured after-screen views have zero horizontal overflow, sub-44px visible buttons, page errors and external requests. Contact sheets `polish/after-contact-*.png` cover every captured screen at 390px, including bottom-of-page states and additional sheets. Reference intent is retained through purple/plum hierarchy, pastel support, compact spacing and department-specific navigation; this is not a claim of pixel-identical reproduction.

## Screen-by-screen quality review

| Screen | Confirmed problem / improvement | Functionality preserved or completed |
|---|---|---|
| Shared header/search | Replaced inconsistent glyphs with bundled original icons; compact brand/search/cart badge | Home, common search, live local cart count |
| Bottom navigation | Consistent active treatment, icon sizing and safe-area padding | All five shared tabs |
| Home | Repetitive generic blocks replaced by editorial plum banner, eight-department rail, compact product picks and distinct collection/builder sections | Data-driven placements, collection navigation, product options, wishlist and quick add |
| Categories | Added searchable catalogue and compact department accordions | Main → Sub → Child routing, all eight departments, inactive ninth stays excluded |
| Search/listings | Always-expanded generic filters crowded the product area; moved to scrollable sheet | Suggestions, combined recipient/colour/budget/sort filters, clear, pagination, errors/retry, empty results |
| Main/sub/child pages | Shared cards and controls now consistent | Source family/child labels, breadcrumbs and specialized facets |
| Product cards | Large/inconsistent artwork and nested touch controls replaced by compact illustrated image areas and sibling controls | Canonical SKU prices, option selection or quick add, wishlist, sold-out/inquiry states; no invented ratings or discounts |
| Product detail | Consistent artwork, controls and selected variant state | Variant pricing/stock, size guide, specifications, customization, cart and inquiry actions |
| Wishlist | Single saved item previously expanded too widely; now uses responsive shared grid | Add/remove, profile/guest merge and reload persistence; useful empty-state action |
| Cart | Dense text-only lines improved with compact image/price/quantity layout | Add/remove/quantity, variant change with merge/stock validation, customized/bundle snapshots and PIN validation |
| Account | Long inline address/runtime forms replaced by address sheet and collapsed connection tools | Demo login/failure/retry, address add/edit/delete/persistence, inquiry/review links; confirmed reset |
| Personalization | Improved template area and included selected local photo in preview | Required name/engraving/photo validation, lettering selection, draft reload, local media and cart snapshots |
| Hamper builder | Long repetitive item/form stack split into Items / Details / Finish with persistent validation/action footer | Searchable/windowed full compatible selection, quantities, capacity/budget/stock, packaging, message, per-item customization and persisted draft/step |
| Wedding department | Receives compact shared visual system | Separate faith/region/tradition/function search, optional family plan, family verification and editable function kit |
| Wedding listing/tradition/function | Improved shared cards/buttons | Source ceremony paths, optional plan dates/quantities and specialized kit personalization remain |
| Birthday | Consistent rail/filter/card design | Recipient, arbitrary age, milestones, interests, budget and unverified delivery paths |
| Anniversary | Consistent rail/filter/card design | Recipient, named milestone, arbitrary year, interests and budget paths |
| Personalized Gifts | Compact shared search/product system | Nine families and child routes; text/photo/engraving/wearable schema distinctions |
| Hampers | Compact prebuilt sets and builder entry | Ten families, component-backed sets and existing recipient/occasion/budget rules |
| Clothing | Compact shared cards, option selection and facets | Eight browsing paths, audience, size/colour/fabric/fit, SKU artwork and size guide |
| Stationery | Compact shared cards and specification controls | Eleven families and type-specific paper/writing/specification filters |
| Furniture | Consistent sector/family/filter controls | Nine Home + nine Commercial families, dimension/material/finish/style filters and inquiry-only actions |
| Furniture inquiry/requests | Shared inputs/buttons/spacing and local status clarity | Reference photos, dimensions, requirements, save/edit/revision/withdrawal and profile persistence; never sent to a vendor |
| Offers | Replaced sparse generic block with illustrated introduction and browse action | Honest no-verified-offers state; no fake promotion |
| Local review (new) | Replaced dead-end checkout with explicit local review | Sample address, canonical demo subtotal, saved snapshot, stale-cart detection and profile isolation. No payment/order/reservation |
| Missing product/route, loading, recovery | Compact clear state components, static skeletons and recovery actions | Missing/empty/failure/retry, slow demo mode and corrupt local storage recovery |

Original local SVG illustrations were rendered into bundled PNGs for Android/iOS/web compatibility. They are marked DEMO DESIGN and are not supplier product photos. Approved merchant photography was not present in the repository. No remote image service was introduced.

## Interaction and mobile checks

- Existing department regression covers all eight independently, including wedding plan/kit, birthday age, anniversary year, personalized engraving/photo, prebuilt/custom hampers, apparel SKU and size, stationery paper specs and furniture photo/revision/withdrawal.
- New regressions cover category search, quick add, wishlist removal/reload; cart variant persistence; address editing/deletion/reload; local review save/reload/staleness/profile isolation/disabled payments; builder step restoration/search; Escape dismissal; offline already-loaded fixture cart; corrupt-storage reset.
- Shared touch controls have 44px minimum targets. Existing four-width visual audit checks actual button geometry, overflow and runtime/console errors. Final five-width screen sweep checks overflow, page errors and unexpected external requests, with measured button geometry recorded in JSON.
- Press feedback uses restrained 160ms opacity; reduced motion avoids interpolation and sheet fade. Keyboard submit/dismiss, labelled controls, selected/expanded states, polite status notices, modal semantics and tab semantics are present. Actual TalkBack/VoiceOver testing is not claimed.
- Fixture operations can continue without network after assets/app are loaded. A cold offline Expo reload is not supported or promised. Local API unavailable/timeout/empty states retain visible retry; no fixture fallback disguises API errors.
- Android adb/emulator and an attached device were unavailable. iOS simulator is unavailable on this Windows host. Native keyboard, photo permission UI, system back, physical-device safe areas and performance still require device QA. Native exports below verify bundling only.

## Verification

Commands run from `apps/mobile` unless noted. Full transcripts are in [polish/verification](polish/verification/fixture-browser.txt).

| Check | Command | Result |
|---|---|---|
| TypeScript | `node node_modules/typescript/bin/tsc --noEmit` | Exit 0 |
| Lint | `node node_modules/eslint/bin/eslint.js .` | Exit 0 |
| Unit tests | `node --experimental-strip-types --test tests/*.test.ts` | 36 passed, 0 failed |
| Existing responsive audit | `node node_modules/@playwright/test/cli.js test --grep-invert 'screen catalogue'` | Four live visual audits passed at 320/390/834/1194px; initial full run also caught the subsequently fixed hamper transition duplicate |
| Fixture customer regression, final exported web app | Set process-only `E2E_BASE_URL=http://127.0.0.1:8083`; `node node_modules/@playwright/test/cli.js test --grep-invert 'screen catalogue\|live visual audit'` | 20 passed, 1 intentional local-API-only skip, 0 failed (1.5m) |
| Local API customer regression | Same functional suite with process-only `E2E_BASE_URL=http://127.0.0.1:8082`, `E2E_DATA_MODE=local-api` | 19 passed, 1 intentional offline-fixture skip, 0 failed (3.5m); final supplementary interaction suite 3 passed, 1 intentional skip (1.2m), including added category/wishlist/profile-isolation checks |
| Isolated API integration | From root: `node --test apps/local-api/tests/*.test.ts` | 7 passed, 0 failed |
| Five-width screenshots | `node node_modules/@playwright/test/cli.js test e2e/polish-visual.spec.ts --workers 2` | 5 passed, 0 failed (20.0m); 320/390/430/834/1194px |
| Fixture Android/iOS/web export | `node node_modules/expo/bin/cli export --platform all --output-dir dist` | Passed; Hermes Android/iOS and web bundle |
| Local API Android/iOS/web export | Same export with process-only local API env, output `.expo/polish-local-export` | Passed |

The first native export was blocked by sandbox compiler permissions and succeeded with local execution permission. Early local API tests started before its server was ready; the clean rerun above passed. An early screenshot sweep exceeded its four-minute per-width harness limit; the comprehensive sweep uses ten minutes per width without relaxing assertions. Metro-based fixture regression was intermittently slow on page reloads (including explicit IPv4); one full run had 19 passed, 1 skipped and 1 navigation-timeout failure in 17.8m. The final built-fixture suite above passed in 1.5m without increasing its default test timeout or relaxing assertions. Expo startup and all five Expo screen sweeps passed, but the cause of the development-server navigation delays is not resolved. These earlier attempts are not represented as successful runs.

Known Node typeless-package and NO_COLOR warnings remain; package/module configuration was not changed solely to suppress test-runner warnings. Existing dependency advisories documented in TASK_10_READINESS.md remain unresolved; no dependency audit/update was performed as part of this UI task.

## Files and checkpoints

[Complete changed-file manifest](MOBILE_POLISH_CHANGED_FILES.txt) lists actual changes relative to `db1d46c`, including source, tests, original local SVG/PNG artwork and real screenshot evidence. Changes are confined to `apps/mobile`. User-owned untracked `.env.example` and ignored `.env.local` are excluded.

- `4db46c7`: shared theme/shell/home/cards/categories/filter-sheet visual checkpoint.
- `7f2241b`: completed local customer interactions and demo review.
- Final QA checkpoint: recorded in Git history after final evidence/report verification.

Rollback: revert the task checkpoints in reverse order. No real database, shared API contract or production service needs rollback. Stored demo schema remains version 1 with an optional review property, retaining existing profile data.

## Launch

Fixture default, from the repository root:

```powershell
cd apps/mobile
node scripts/start-expo.cjs --web --offline --port 8081 --max-workers 2
```

Open `http://127.0.0.1:8081`. For a compatible native development client/device, use `node scripts/start-expo.cjs --android`; macOS/Xcode is required for iOS simulator work. These commands are not a claim that a native device was tested here.

To review the exported fixture web app without Metro, after the fixture export:

```powershell
node scripts/preview-web-export.cjs
```

Open `http://127.0.0.1:8083`. This helper serves static `dist` assets on loopback only, supports deep links and has no catalogue endpoints or writes.

Optional existing local API mode, two terminals:

```powershell
# Terminal 1, repository root
node apps/local-api/src/index.ts
# Terminal 2
cd apps/mobile
node scripts/start-local-api.cjs
```

Open `http://127.0.0.1:8082`. The wrapper sets local API env only for that process. Default `.env.local` remains fixture mode.

## Remaining release work

Approved merchant images/content, real device and assistive-technology QA, resolution of existing dependency advisories and investigation of intermittent Metro navigation delays remain. The local exported-web preview is available for reliable review. Demo profiles do not provide authentication/security; local reviews are not orders; furniture requests stay on the device. Trusted pricing/inventory/tax/shipping, real auth/uploads, payment and order processing remain deliberately deferred under the user's priority change. Existing admin and customer website remain untouched. The next safe task is device/merchant-content validation of this UI checkpoint, not external service integration.
