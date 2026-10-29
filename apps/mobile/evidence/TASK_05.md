# Task 05 — Wedding discovery, family plan and editable function kits

Inspected: Task 05, original two wedding workbooks and diagram PDF; source traditions and ceremony records re-read from the taxonomy workbook. Existing admin snapshot remains read-only. import-wedding.py uses read-only workbook access and writes only mobile fixture JSON.

Changes: wedding source JSON/import script; typed wedding template/need adapter and plan validation; WeddingHome; tradition/function/product routes; profile plan persistence; generalized builder supports wedding-kit; global search includes source tradition/function terms; retry mode synchronization; boolean render fixes; wedding unit/browser and edge-state browser tests. Source ranges retained per ceremony. No database migration or admin change.

Behavior: 31 research traditions and 316 optional function slots, separate faith/region/community axes, optional selections across traditions, saved custom family events/date/guest count. Marathi, Gujarati, Sikh/Hindu Punjabi, Bengali, Tamil, Telugu, Kerala, Muslim, Christian and other supplied routes exist. Function pages show source shopping notes and all five product lanes plus editable kit entry. CeremonyNeed -> product type -> existing SKU mapping is explicitly demo merchandising, not culturally approved compatibility. Family acknowledgement precedes kit editing. Return gift quantities validate; kit price/components saved to cart; no duplicate permanent product/SKU.

Verification (2026-10-24):
- `node node_modules/typescript/bin/tsc --noEmit`: exit 0 after correcting builder argument integration.
- `node node_modules/eslint/bin/eslint.js .`: exit 0, no warnings.
- `node --experimental-strip-types --test tests/*.test.ts`: 15 passed, 0 failed. All earlier suites plus source integrity, distinct faith/region paths, canonical SKU mappings, kit total/requirements, valid date and guest limits.
- `$env:E2E_BASE_URL='http://127.0.0.1:8082'; node node_modules/@playwright/test/cli.js test`: 7 passed in 27.5s. Includes all earlier flows; Marathi Sakharpuda -> family acknowledgement -> editable kit with 3 return gifts -> ₹1,195 demo cart snapshot; persisted custom event and selected function; Punjabi Sikh Anand Karaj navigation. Slow loading, failure recovery, keyboard search, sold-out SKU, >=44px primary control and reduced-motion 320px viewport also passed.
- `node node_modules/expo/bin/cli export --platform all --output-dir dist`: exit 0. Android/iOS Hermes and web assets compiled locally after final source corrections. Not native binary or device verification.
- `EXPO_OFFLINE=1 ... expo install --check`: exit 0, dependencies up to date; CLI warns offline validation is less reliable. An initial unsupported --offline argument was corrected to the environment setting.
- Limited static scan: 0 matches for Firebase-key/private-key/live-Razorpay patterns; 0 Firebase SDK imports. This is not a full security audit.
- Screenshots captured: wedding kit cart, Sikh function page, sold-out reduced-motion viewport. Wedding cart/function captures reviewed visually.

Open gates: native hardware/simulator, large native font scaling, native keyboard/safe-area/permissions and performance QA; full trusted staging auth/upload/rules/payment/order flows; actual cultural reviewer approval, supplier inventory/image rights/delivery. No religious review was fabricated. Event dates are planning notes, not background notifications. Five high dependency advisories remain in Expo tooling (node-forge/zod); available audit fix proposes incompatible downgrade, so no force fix used. Original full legacy repo still required before later admin interoperability work.

No production Firebase, admin, roles, historical data or deployments touched. Demo implementation for Tasks 01–05 is complete against available verification; full staging/native acceptance is not claimed. Rollback by reverting task commits; local demo reset is available in Account. Stop here. Next assigned scope is Task 06, then Tasks 07–11 before admin work can be approved.
