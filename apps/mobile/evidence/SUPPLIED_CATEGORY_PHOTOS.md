# Supplied category photos — 30 October 2026

Reused the owner's 17-image set and its existing optimized ImageKit files. Compared the original contact sheet with the actual phone-size renders. No images generated, uploaded or replaced in Firebase.

- The occasion circles, homepage cards and category grid now use the matching supplied department photographs. Square tiles and circles clip with `cover`; wider cards use 4:3 image areas without stretching. Labels remain outside the images.
- All three homepage carousel slides use supplied photos. Removed the large gift illustration that obscured the first hero.
- Identified six exact legacy batch hero files in the published feed that overrode the supplied images. Added a read-time replacement for only those immutable files. New admin image URLs retain priority. This also corrects the existing department hero display without overwriting historical records.
- Added the public ImageKit CDN endpoint to the hosted mobile export so admin-managed photos can render. Private ImageKit credentials remain server-side.
- Home decor remains a furniture search shortcut, not a ninth department. Subcategory-specific images are preserved; no unrelated department photo is assigned to a subcategory or product.

Changed: `aarvika-mobile.tsx`, `home-discovery.tsx`, Categories screen, shared `hero-images.ts`, focused hero tests and `build-apphosting.cjs`.

Checks: mobile TypeScript PASS; targeted mobile/build-launcher ESLint PASS; four focused hero tests PASS, including preservation of new admin URLs; production Expo export PASS. Candidate browser checks at 320px and 390px confirm all nine grid tiles load the supplied ImageKit assets, carousel/navigation/account still work, and zero runtime errors. Visually inspected circles, rectangular cards and square category crops. No live catalogue writes.

Deployment verification pending rollout.
