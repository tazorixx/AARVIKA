# Task 01 — scaffold and shell

Inspected: root project guidance, Tasks 01–05, original category PDFs/images and partial admin snapshot from Task 00; generated mobile AGENTS.md; Expo SDK 58 and Router installation/layout docs. Combined task file absent. No active full legacy repository supplied; owner explicitly authorized a fresh independent app.

Created: official blank TypeScript Expo scaffold, SDK-compatible Router/safe-area/screens/Reanimated/storage/image-picker dependencies, src/app route hierarchy, compact system-font tokens, shared header/search/cart, five tabs, eight department destinations, inactive reserved slot, state components, shell tests, browser checks and README. App.tsx/index.ts replaced by Router entry. No backend/schema/admin edits. Original handoff preserved in root baseline c0579e0. Nested scaffold Git metadata moved to temporary backup; root branch app/tasks-01-to-05 owns all checkpoints.

Verification (2026-10-24):
- `node node_modules/typescript/bin/tsc --noEmit`: initial missing Node type declarations fixed via explicit types; rerun exit 0.
- `node node_modules/eslint/bin/eslint.js .`: exit 0.
- `node --experimental-strip-types --test tests/*.test.ts`: 1 passed, 0 failed.
- `node node_modules/@playwright/test/cli.js test e2e/shell.spec.ts`: 1 passed; all eight routes, search and cart; no page errors. 320/390/768 browser widths had no horizontal overflow.
- Screenshots: task-01-home-320.png, task-01-home-390.png, task-01-home-768.png. Reviewed 320 image.
- Metro started offline on localhost:8081. DevTools download denied by sandbox; fallback used successfully.
- npm audit: 5 high advisories through Expo CLI (node-forge/zod); no critical advisories. No force downgrade applied. Investigate compatible transitive fixes before final delivery.

Limits: browser viewport evidence is not native simulator/device verification; no Android SDK/iOS simulator available. Native accessibility/safe area/performance QA remains outstanding. Fixtures only; no auth or checkout claim.

Rollback: revert this task checkpoint. Next: Task 02 shared discovery. Browser/type/lint/unit gate passed; native gate remains explicitly unverified.
