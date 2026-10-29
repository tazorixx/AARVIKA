# Task 04 — personalization and bundle engine

Inspected: Task 04, catalogue PDF combo eligibility/durable-goods rules, SDK 58 ImagePicker and FileSystem documentation. No admin upload endpoint reused.

Changes: domain/personalization.ts and bundles.ts; local media adapter; schema-driven form/template preview; persistent profile drafts and gift-box draft; customer-actions integration; interactive builder; photo permission config; header-count context separates store/UI imports. New personalization/bundle unit and browser tests. All prices from immutable demo SKU service data, never claimed trusted production prices. No permanent product/SKU created by arbitrary mix.

Checks:
- TypeScript and lint: final exit 0, no lint warnings. Fixed duplicate import, React Native empty-string child warnings and header/store cycle.
- `node --experimental-strip-types --test tests/*.test.ts`: 10 passed, 0 failed. Includes required/length/choice/media validation; incompatible goods, insufficient stock, capacity and personalization failures; exact price preview.
- Browser suite against local exported app: 5 passed including actual image file chooser, name/photo draft reload, personalized cart snapshot, 2-item box at ₹497 including packaging, message reload and component cart snapshot, earlier customer/catalogue/shell regressions. An earlier Metro run had a combined-route loading timeout; a retry was interrupted and the suite moved to the production export to avoid dev-server delays.
- `node node_modules/expo/bin/cli export --platform all --output-dir dist`: exit 0 after rerunning with permission for the local Hermes executable. Android/iOS .hbc and web assets generated. This is bundle compilation, not a native binary/device test or deployment. Initial sandbox run denied hermesc.exe execution.
- Added local-only scripts/serve-preview.py and E2E_BASE_URL support. Preview bound to 127.0.0.1:8082.
- Screenshots: task-04-personalization-390.png and task-04-bundle-cart-390.png. Product screenshot reviewed. Inner ScrollViews mean fullPage browser capture is viewport-limited.

Privacy and limits: selected photos are LOCAL ONLY, never uploaded. Web demo stores image data in local storage; native adapter copies to app documents. Type/size/content-header checks do not replace server inspection/moderation. Native permission-denial and copy path remain untested on hardware. Removing a draft photo removes its association; local copied files are retained until the explicit all-demo reset. Reset deletes the app-owned media directory and local profiles. No staging auth, private upload policy or checkout available.

Rollback: revert Task 04 checkpoint; clear local demo data via Account when desired. Next: Task 05 source-backed wedding templates and kits. Available checks passed; native/staging gates remain outstanding.
