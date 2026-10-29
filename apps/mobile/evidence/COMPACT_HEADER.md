# Compact discovery header — 26 October 2026

Inspected: project and mobile AGENTS.md, app-first master, Tasks 01/02/03, design specification, category matrix, supplied header screenshots, purple Home reference, shared Header/Page, Home, Categories, tab layout and existing browser checks. No taxonomy changes required.

Changes:
- `src/components/ui.tsx`: removed the global demo banner; explicit page-level header tools; compact search/photo search and delivery row; 120/180 ms press feedback respecting reduced motion.
- `src/app/(tabs)/index.tsx`: Home enables search plus delivery.
- `src/app/(tabs)/(browse)/categories.tsx`: Categories enables search only.
- `src/app/(tabs)/_layout.tsx`: hide only the delivery tab button. The installed Expo Router maps `href: null` to a hidden route that redirects; direct navigation now works while exactly five buttons remain visible.
- `e2e/shell.spec.ts` and `e2e/shopping-enhancement.spec.ts`: updated expectations and entry paths for the requested header behavior.
- Screenshot evidence: `compact-header-home-{320,390,414}.png`, `compact-header-categories.png`, `compact-header-location.png`; shell test also refreshes its Home evidence images.

No contract, backend, admin or production changes. Existing product/demo disclosures remain outside the removed header banner.

Verification:
- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `node node_modules/@playwright/test/cli.js test e2e/shell.spec.ts e2e/bottom-navigation.spec.ts e2e/shopping-enhancement.spec.ts --grep 'shared tabs|five tabs|focused delivery'`: shell and bottom-navigation passed; delivery initially failed because the hidden route redirected to Home.
- After the routing fix, `node node_modules/@playwright/test/cli.js test e2e/shopping-enhancement.spec.ts --grep 'focused delivery'`: 1 passed, including save/edit/persistence and location denial.
- Browser inspection: Home row height 46 CSS pixels; search share approximately 69.7% at widths 320/390/414. Categories has search only. Offers, Wishlist, Account and Delivery have neither header tool. Delivery has five visible tabs. Screenshots visually inspected for Home and Categories.

Limits/next check: Chromium phone-sized viewports, not native Android/iOS device testing. Native keyboard, large system text and safe-area verification remain. No claim of app-ready sign-off or measured performance speedup.

Rollback: reverse only these header props/styles, tab-button option and corresponding test updates; preserve earlier navigation work and all other local changes.
