# Floating category control — 26 October 2026

Inspected the supplied reference image, project app-first and Task 02 rules, design/motion guidance, source category hierarchy PDF, current Home/Categories/department/category/search routes, shared Page and catalogue contract. Also checked Expo SDK 58 and React Native Animated documentation.

Scope: UI only. Changed `src/components/department-side-rail.tsx`, `src/components/ui.tsx`, Home `src/app/(tabs)/index.tsx`, Categories `src/app/(tabs)/(browse)/categories.tsx`, and `e2e/department-side-rail.spec.ts`. No catalogue contract, backend, admin, or deployment changes. Rollback is these UI edits and the updated rail test.

The right-side control is 58 px wide when closed and overlays the full-width page. It displays the current department (or All on Home and Categories). Tapping it animates a 300 px capsule from the center upward and downward, showing five circular options at a time. Its inner list scrolls through All and all eight active departments. Picking one recenters it, closes the capsule toward the center, then navigates. It also has a Close control and closes after ten seconds without interaction; scrolling resets that timer. Motion is disabled when reduced motion is active. Home hero, category tiles and product grid regained full width.

Verification: `npm run typecheck` passed; `npm run lint` passed. Playwright rail and visual landing run: 5 passed (including open/close, navigation, nested category, 10-second close, all eight department landings). Bottom navigation: 1 passed. Browser screenshots at 320 and 390 px show no horizontal overflow. The open rail has a five-item viewport and all nine targets remain reachable through its inner scroll. `git -c core.whitespace=cr-at-eol diff --check` passed.

Screenshots: `floating-category-home-320.png`, `floating-category-home-390.png`, `floating-category-open-390.png`, `floating-category-custom-390.png`.

Remaining app QA: native Android/iOS device touch, accessibility, and performance checks. Android Debug Bridge is unavailable in this environment. The control navigates the eight confirmed main departments; their subcategory and child paths remain in the category browser.

## Arrow affordance follow-up

The user-supplied Clothing screenshot showed that the closed circle did not clearly suggest expansion. Two lavender up/down arrow cues now flank it. Either cue can be tapped, while the central circle remains the single screen-reader and keyboard control. During the 260 ms opening the arrows travel outward with the capsule and fade; they travel inward on closing. The existing reduced-motion path skips the movement.

Changed `src/components/department-side-rail.tsx` and `e2e/department-side-rail.spec.ts`; no layout, catalogue, or route changes. Rollback is the arrow cue interpolation, views, and focused test. Screenshots: `floating-category-arrows-clothing-320.png`, `floating-category-arrows-clothing-390.png`, `floating-category-arrows-open-390.png`.

Verification: `npm run typecheck` passed; `npm run lint` passed; focused Playwright arrow motion/tap test passed (1/1). A broader rail run after the initial cue addition passed (3/3). The final cue was checked at 320 and 390 px. Native device animation and touch testing remains for app QA.

## Idle icon animation follow-up (superseded)

The closed rail button now gives a brief 7% scale pulse while the arrow cues nudge 7 px outward, then return. The loop pauses between pulses, stops while the rail is open, and is disabled under reduced motion. The existing center-out opening/closing and tap behavior remain. Changed only `src/components/department-side-rail.tsx` and `e2e/department-side-rail.spec.ts`; rollback removes the `hint` animation and its test. Animated preview: `floating-category-icon-animation.gif`.

Verification: `npm run typecheck` passed; `npm run lint` passed; full rail suite passed 7/7 before the final numeric pulse increase, then the focused idle/reduced-motion tests passed 2/2 with the final values. Native device performance remains for app QA.

## Split-circle animation revision

The owner rejected the repeating pulse, so it was removed. The closed category icon is now still. On tap, a purple upper half with an up arrow and a lower half with a down arrow separate from the center as the rail opens between them; closing reverses the movement and reveals the selected category icon only after the halves meet. The outer arrow cues remain tappable. Reduced motion opens or closes immediately without the split pieces.

Changed only `src/components/department-side-rail.tsx` and `e2e/department-side-rail.spec.ts`; no layout, catalogue, or admin change. Rollback is the split-half views/state and revised tests. Preview: `floating-category-split-animation.gif`. The former `floating-category-icon-animation.gif` is retained only as historical evidence of the rejected approach.

Verification: `npm run typecheck` and `npm run lint` passed after the revision; the complete Playwright rail suite passed 7/7, covering split/reduced-motion/arrow motion, navigation, scrolling, and timed close. Native device motion remains for the app QA gate.
