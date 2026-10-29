# Right-side department rail — 26 October 2026

Superseded by `FLOATING_CATEGORY_CONTROL.md`, which replaces the tall rail with a compact expanding category control.

Inspected the supplied side-navigation reference, AARVIKA app-first rules, Tasks 01/02, compact purple design guidance, the existing Home/Categories/department/category/search routes, shared Page, department catalogue contract and existing navigation tests.

Implemented one right-side capsule rail, starting at 30% of the visible page height and ending 5% above its bottom edge. It independently scrolls through All and the eight active departments from the typed catalogue. The current department is highlighted on department, nested category, Wedding and department-filtered result pages. Home and Categories select All. A 150 ms hover/press response respects reduced motion. Main content reserves rail width; the small Home and Categories tiles and narrow-phone hero were compacted to keep gifts visible.

Files: new `src/components/department-side-rail.tsx` and `src/state/catalogue-context.ts`; updated `src/components/ui.tsx`, `department-grid.tsx`, `visual-commerce.tsx`, `src/state/catalogue.tsx`, Home/Categories/department/category/search/Wedding routes under `src/app/(tabs)/`; new `e2e/department-side-rail.spec.ts`. No catalogue contract, backend, admin or production changes. The context split removes a circular import between the shared UI and catalogue provider. Rollback is the rail component, Page prop/use sites, tile size changes, context split and its test.

Verification: `npm run typecheck` passed; `npm run lint` passed; `e2e/department-side-rail.spec.ts` plus eight-department visual navigation: 3 passed; rail plus catalogue filter/back checks: 3 passed; bottom navigation: 1 passed. Chromium 320/390 viewport screenshots show no page overflow. The 390-pixel rail measured x=310, top=234, height=507; the bottom tab began at y=780, leaving 39 pixels. Independent scroll, active state, nested-category state and hover tint were checked. `git diff --check` passed with CRLF whitespace interpretation.

Screenshots: `right-rail-home-320.png`, `right-rail-home-390.png`, `right-rail-categories-320.png`, `right-rail-categories-390.png`, `right-rail-wedding-390.png`, `right-rail-furniture-category-320.png`.

Limit: these are browser phone viewports. Android Debug Bridge is unavailable here, and native Android/iOS screen-reader, touch/keyboard and device performance checks remain for the app QA gate. The rail lists the eight confirmed main departments; their Main/Sub/Child catalogues remain in the category browser.
