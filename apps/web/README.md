# AARVIKA local web storefront

This is a local customer website preview. It uses the same catalogue contract as the mobile app. The home page follows the supplied video's section rhythm with original AARVIKA departments, copy and imagery.

## Run

From `apps/web`, run `node server.cjs`, then open `http://127.0.0.1:4173`.

The site first reads `http://127.0.0.1:3100/api/mobile/v2/catalog` from the isolated admin. If the admin is stopped, it uses `data/demo-catalogue.json`, exported from `packages/catalogue`. The source label appears beneath the hero. To see admin changes, use the existing local emulator launcher and seed in `existing-admin`, then start its local dev server. The web catalogue refreshes on focus and every 30 seconds on discovery pages.

`node scripts/export-demo.cjs` refreshes the fallback snapshot from shared contracts. `node --test tests/*.test.mjs` checks departments, child placements, prices and media rules. `node scripts/verify-browser.cjs` checks desktop and mobile flows and writes screenshots to `evidence/`.

Wishlist, gift bag and furniture inquiry drafts stay in this browser. Prices and stock are demo data. The site does not place orders, charge payments or send an inquiry to a vendor.

## Original editorial artwork

The four WebP images in `assets/` were generated for this project with the built-in image generation tool and optimized locally. Prompts described: a plum wrapped gift on an ivory table; a birthday cake with a lavender gift; a culturally neutral wedding gift arrangement; and a mug, journal and frame for personalized gifting. They are collection artwork, not photos of the products listed in the catalogue. Product media comes from the local admin when available; the offline preview uses labelled demo illustrations copied from the repository's existing `demo-art` set.
