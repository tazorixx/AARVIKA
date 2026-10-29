# AARVIKA Tasks 01–05 result

Implemented sequentially in `apps/mobile` on branch `app/tasks-01-to-05`, using the owner's explicit fresh-app authorization. No combined instruction file was present. Root handoff and references were preserved in baseline `c0579e0`. No admin source was extracted, edited or deployed.

| Task | Deliverable | Checkpoint |
| --- | --- | --- |
| 01 | Expo SDK 58 TypeScript / Router, compact purple tokens, shared header, five tabs, eight department routes, inactive ninth slot | b4e6eed |
| 02 | Typed catalogue/contracts, exact PDF taxonomy, dynamic home, search/suggestions/filter/sort/PLP/PDP/SKU foundation | 881c75f |
| 03 | Local demo profiles, sample addresses, persistent wishlist/cart, variants, guest merge, error/retry controls | 48d4bbc |
| 04 | Local photo selection, personalization validation/preview, saved drafts, constrained gift-box builder and cart snapshots | 2f149bd |
| 05 | Source-backed wedding research routes, optional family plans, product lanes, canonical-SKU kit mapping and kit-to-cart | See final Git log / TASK_05.md |

Per-task inspection, files/behavior, test outcomes, failures corrected, limitations and rollback are recorded in TASK_01.md through TASK_05.md. FILES_CHANGED.txt enumerates the actual deliverable paths. Source UI and adapter contracts are TypeScript; generated source JSON is clearly fixture/research data. No fake merchant reviews, discounts or delivery promises. Illustrative artwork is marked DEMO DESIGN.

## Final checks

- TypeScript: passed; lint: passed without warnings.
- Unit tests: 15 passed, 0 failed.
- Browser tests against local export: 7 passed, 0 failed (27.5s).
- Android/iOS Hermes + web export: passed. This does not prove native runtime/device behavior.
- Browser widths: 320/390/768; screenshots under this directory. Inner ScrollViews mean screenshots show the visible viewport, not the entire app scroll surface.
- Demo behavior covered: SKU selection and separate variants, back state, compound filters/empty/missing, wishlist/cart/profile relaunch, guest merge, sample addresses, simulated failures and retry, name/photo draft reload, bundle constraints and snapshots, wedding choices/kit, keyboard input, sold-out and reduced motion.
- Dependency check: reports up to date in offline mode. Audit still reports 5 high / 0 critical tooling advisories through Expo CLI. No incompatible force downgrade was applied.

## Launch

```sh
cd apps/mobile
npm ci
npm start
# browser preview
npm run web
```

Use a matching Expo Go version on a physical device to scan the QR. Android emulator launch: `npm run android` when Android tools exist. iOS simulator needs macOS: `npm run ios`. Store bundle identifiers/signing are unconfirmed; no build submission configured.

```sh
npm run typecheck
npm run lint
npm test
npx expo export --platform all --output-dir dist
python scripts/serve-preview.py
# in another PowerShell terminal
$env:E2E_BASE_URL='http://127.0.0.1:8082'
npx playwright test
```

CHROME_PATH can override the Windows Chrome path for browser tests. Preview server binds only 127.0.0.1. Export is local, not deployment. Setup references: https://docs.expo.dev/router/installation/ and https://docs.expo.dev/versions/v58.0.0/.

## Remaining work

Local profiles are NOT authentication. Photos remain local and are NOT private server uploads. Cart totals are previews; checkout is disabled and no payment/order is created. Isolated staging integration in Task 10 must enforce ownership/rules, price/stock, upload inspection/retention, idempotent checkout, gateway test payment verification and order state. Actual merchant inventory/media/delivery and cultural review are not supplied. Native hardware/simulator, font scaling, keyboard/insets/permission denial and performance QA remain required.

Tasks 06–09 complete the remaining department-specific flows. Task 10 adds trusted staging commerce; Task 11 is full app QA and explicit owner gate. Existing admin stays held until that gate; website remains Task 14. Nothing was deployed and production Firebase was not accessed.
