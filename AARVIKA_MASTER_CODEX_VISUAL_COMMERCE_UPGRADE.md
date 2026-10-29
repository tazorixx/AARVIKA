# AARVIKA — MASTER CODEX PROMPT: PREMIUM VISUAL COMMERCE UPGRADE

You are continuing an EXISTING, functional Expo/React Native gifting marketplace. Implement a visually premium, image-first, interactive category-discovery system for all eight departments, using only necessary free/open-source Expo-compatible presentation libraries. Do not rebuild the app or repeat completed work.

## Project and existing checkpoints
- Workspace: `C:\Users\ASUS\Desktop\AARVIKA`
- Mobile: `apps/mobile/` (Expo SDK 58, Expo Router, TypeScript)
- Copied admin: `existing-admin/` (Next.js; **preserve existing template**)
- Shared contracts: `packages/catalogue/`
- Local read-only catalogue API: `apps/local-api/`
- Existing admin-to-mobile integration checkpoint: `089f00f`
- Recent mobile image/search/location enhancement checkpoint: `81e29b4`
- Existing app has eight departments, a local fixture mode, an isolated admin-emulator mode, and existing catalogue/personalization/cart/navigation flows. Those are already implemented; inspect only affected code before changes.
- Read applicable `AGENTS.md`, `DESIGN_AND_MOTION.md`, `CATEGORY_FEATURE_MATRIX.md`, and admin preservation V2 guidance. Reuse the prior QA reports rather than performing a new repository-wide audit.

## Critical user direction
Our current category screens, especially Wedding/tradition/function flows, appear like long forms, checklists or research templates. Customers should instead feel that they are browsing an attractive modern gifting ecommerce marketplace inspired by the DISCOVERY PATTERNS (not copied designs) of Amazon, Flipkart, FNP and IGP.

Use established AARVIKA branding: primary purple `#62298E`, deep plum `#3E155C`, coordinated soft lavender/blush/peach/mint. Premium, compact, modern and distinct—not generic oversized AI-generated cards. Product and gift visuals should be the dominant elements; relevant products and collections must appear early. Keep the current business logic, data contracts, category hierarchy and functioning special features.

**This is a full implementation task, not just another analysis or planning report.** Work through the eight departments, but share components and contracts; no eight duplicated layouts. A brief focused code inspection is sufficient.

## 1. Use a SMALL set of free libraries, only if necessary
Check installed versions first; reuse what is already present. Resolve Expo SDK 58 version compatibility before any installation.
- Use existing `expo-image` for cached, responsive image delivery; do not replace it.
- Prefer installed/compatible `react-native-reanimated` (+ worklets as required) for smooth micro-interactions.
- `expo-linear-gradient` for tasteful hero/overlay gradients if not already installed.
- `expo-haptics` for subtle native feedback if compatible; web gracefully no-ops.
- OPTIONAL `@shopify/flash-list` only if an existing long product grid demonstrates a real performance issue.
- OPTIONAL `@gorhom/bottom-sheet` only if existing sheet/modal components cannot produce the intended experience.
- OPTIONAL `react-native-reanimated-carousel` only after SDK 58 compatibility is verified; otherwise use existing FlatList/ScrollView paging.
Use `npx expo install` / version-matched dependencies only where actually necessary. Avoid UI-kit sprawl, overlapping carousels, heavy animation engines, additional backend services or paid components. Respect reduced-motion settings and touch accessibility.

## 2. Shared visual commerce page renderer
Create/refine a reusable, typed, admin-data-driven page-composition system that works in fixture mode AND with the existing versioned admin catalogue adapter. Preserve old contracts and routes through small compatibility adapters where necessary.

Support these section types only if they are meaningful and supported by real/demo data:
- Responsive category hero: lifestyle/photo/banner image, short headline, concise subheading, one primary CTA, optional secondary CTA.
- Image-led quick-discovery shortcuts: occasion, recipient, tradition, function, product family, budget, room, and other department-specific paths.
- Curated collection carousel with visual collection covers and links.
- Shop-by visual grid (main/sub/child categories), with images, short readable names and meaningful destinations.
- Product carousels with quick wishlist/add-to-cart where valid.
- Compact sticky filter/sort chips, accessible bottom sheet or filter drawer, without obscuring products.
- Promo/editorial strip for bundles, personalization, custom kits, or furniture inquiries.
- Two-column compact product grid on typical phones, adapting to tablet widths.
- Collapsible practical notes/requirements for specialized products.
- Clear skeleton, empty, error and retry states without blank screens.

Page layout order should put hero, visual shortcut tiles and product/collection discovery above long descriptive explanations. Avoid repeating global header/search on every nested route if the layout already owns them. Ensure deep links/back navigation and retained selection state.

Use real merchandising labels only when backed by catalogue/admin evidence. Do not invent ratings, review counts, sales totals, offers, delivery guarantees, best-seller status, real-time inventory or recommendation claims. If source data is absent, use a neutral section title such as “Explore gifts” or omit that badge/section. New/demo content must be marked as demo where relevant.

## 3. Wedding: redesign all levels, not just landing
The screenshots show forms and optional checklist toggles dominating the viewport. Preserve those capabilities but reorganize them as *secondary optional helpers*, NOT the primary shopping UI.

Wedding landing should include:
- Image-first wedding hero and fast “Shop all Wedding Gifts” CTA.
- Shop by tradition/culture and region as visually appealing collections, without equating culture/state/faith or claiming every family follows a ceremony.
- Shop by function (Roka, Mehendi, Haldi, Sangeet, Wedding Day, Reception, etc.) as photo tiles/chips.
- Shop by recipient, budget and product type.
- Curated wedding essentials, return gifts, personalized gifts and kit/bundle rows sourced from the actual catalogue.

Tradition detail should lead with a concise image/identity header, function tiles, related products and kit cards. Put ritual explanations, optional practices, family verification and source notes in clear *secondary expandable “Planning notes / Family guidance”* sections; preserve their accuracy and distinctions. Do not promote suggested practices as religious requirements.

Function detail should lead with a hero, products/collections, relevant gifts, optional custom kit CTA and variant/cart flows. Move checkbox-based “include in family plan”, quantity configuration and suitability verification into an optional “Plan this function” or “Customize kit” sheet accessed when the customer wants it. Keep validation and family confirmation intact.

## 4. Roll out the SAME visual system to the other seven departments
Do not stop after Wedding. Each department keeps its unique data and business flows:

- **Birthday:** image-led shop by recipient, age/milestone, interest and budget; personalized birthday gifts, curated collections, relevant product cards. Optional guided recommendations should not look like a mandatory form.
- **Anniversary:** year/milestone and recipient image shortcuts; romance/classic/premium gift collections; personalized keepsakes; products early.
- **Personalized Gifts:** the nine existing family paths as image-first tiles; name/photo/engraving examples; clear “Customize” CTA that opens the existing editor and draft persistence; no pretending a preview is a final print proof.
- **Hampers:** ten existing families; budget/style shortcuts; bundle tiles; “Build your own hamper” hero CTA opens existing compatible component-SKU builder. No separate/duplicate stock counts.
- **Clothing:** visual shop by audience, style, occasion, fabric, size; product-first fashion grids, fit/size charts on demand; preserve variant stock.
- **Stationery:** eleven existing product families; gifts, creative/work/school/journaling sections, compact specification filters, bundles and product rows.
- **Furniture:** visual room and Home/Commercial discovery, room-set imagery and specs, compact dimensions/material/finish controls; preserve inquiry-only/customization flows and don't show an ordinary Buy button for quote-only items.

Avoid publishing the existing extra Lifestyle/admin route as a ninth mobile department. Existing cross-category SKU identity and stock authority must remain intact.

## 5. Real visual content + admin-editability
Image-led category design is pointless if cards only contain repeated icons or generic blank placeholders.
- Reuse the existing trusted ImageKit URL policy, `expo-image` rendering, lazy loading, thumbnail/detail sizing, cache, and error fallback. Do not re-implement the completed image performance task.
- Where needed for demo, add a SMALL curated set of project-local or properly licensed example category/hero assets. Never scrape copyrighted product pictures or hotlink another shop’s assets without permission. If assets are unavailable, make appealing gradient/illustrated fallbacks without claiming they are product photography.
- **Every hero, category tile, merchandising image and promo must be replaceable later in the existing admin**, not permanently hardcoded in components. Use typed fields such as image URL/media ref, alt text, position/focal preference where practical, display title/subtitle/CTA, section visibility and order.
- Preserve existing ImageKit public CDN handling; real uploads remain disabled in isolated emulator mode until explicitly authorized and secured. Never place ImageKit private key or Firebase service account in client bundles.
- Add/edit these fields inside existing admin category/merchandising/homepage editors, using their existing controls/layout. DO NOT redesign admin sidebar, dashboard, forms, table styles, fonts, dimensions or navigation.
- Support admin draft/preview/publish/rollback semantics, reuse established permissions and the `packages/catalogue` adapter. Avoid breaking legacy admin content or rewriting the entire catalog schema.
- Fixture/demo mode must display complete coherent visual content even when the admin API is offline. Admin-connected mode must display an explicit error/retry when its backend is unavailable, not falsely claim sync.

## 6. Premium interactions WITHOUT performance regressions
Use measured, restrained interaction patterns:
- Hero swipe/paging only if smooth and accessible; avoid autoplay that distracts or hinders accessibility.
- Press scale/lift, tap feedback, heart/favorite response, add-to-cart feedback, chip selection, filter sheet, skeleton and image fade-in.
- Respect reduced motion. Don't animate every element continuously.
- Consistent 44px-or-better practical touch targets, accessible labels, legible font contrast, clipped-text fixes and proper image aspect ratios.
- Keep navigations, cart, wishlist, variants, personalization, location picker, camera/gallery UI and product-detail flows already working; do not rebuild those features.
- No unnecessary API roundtrips, large image downloads, render loops or expensive list animations.

## 7. Efficient execution requirements — VERY IMPORTANT
The previous admin integration consumed roughly 5.5 hours and substantial Codex usage. Avoid wasting further time.
- First check current Git status/latest completed checkpoints and READ EXISTING REPORTS; do not start a broad audit, research marathon or exploratory browser crawl.
- Make a very brief affected-files plan, then IMPLEMENT. Use shared components, not one-off duplicated files per department.
- Install only actually missing dependencies and only after compatibility check. Do not reinstall completed setup or rerun npm install without need.
- Use meaningful logical commits, preferably one checkpoint for mobile UI and one for admin media metadata if both are affected.
- Test changed components and directly affected pathways only: one Wedding deep flow; one representative landing/navigation for each remaining department; one admin editing/publish flow for media metadata; one fixture and one isolated admin-adapter path if affected; responsive widths 320/390 plus one tablet representative only.
- Prefer programmatic targeted checks + a few representative screenshots. No 50-page gallery or old full QA suite, full export matrix, all browser specs, complete security re-audits or expensive repetitive screenshots unless an actual affected-code regression demands them.
- If an existing test was already green and its code was untouched, reuse the evidence.
- Fix relevant failures; do not embark on unrelated lint warning cleanup, audit unrelated services, or ask to reset Firebase.
- No production Firebase/cloud writes or deployments. Do not modify original `C:\Users\ASUS\Desktop\gift4u`. Do not touch Razorpay, courier/shipping, SMS OTP, paid visual AI search, or other external APIs.

## 8. Objective acceptance criteria
- The first screenful of category pages looks like attractive gifting commerce, NOT a survey or checklist.
- A customer can visually browse from department → visual subcategory/occasion → curated products → product detail → wishlist/cart/customization without forced forms.
- Wedding culture/tradition/function depth and optional family planning remain discoverable and functional, but do not dominate shopping discovery.
- All eight departments use a consistent visual vocabulary with meaningful department-specific shortcuts and content.
- Demo imagery is appropriate and admin-replaceable. A changed published admin category hero/section appears in the isolated connected mobile without rebuilding the app, or report the exact missing link without falsely claiming success.
- The existing admin template remains visually unchanged apart from any small new media/section controls and agreed purple accents.
- Existing fixture mode continues to render a complete app when admin backend is unavailable.
- Targeted TS/lint and focused navigation/render/media/admin editing checks pass. Native runtime/real CDN behavior is only marked verified if genuinely tested.

## 9. Final report, concise
Return ONLY:
1. What already existed and was reused (especially installed libraries and ImageKit/media support).
2. What was changed in the visual component system, Wedding and other seven departments.
3. Which new libraries were actually installed and why (or state none).
4. How an admin edits category images, heroes and section order; what is saved/previewed/published.
5. Changed-files summary and Git commit IDs.
6. Small list of targeted test results; 2–4 representative before/after screenshots if possible, no giant repeated galleries.
7. Genuine remaining blockers, if any, with a specific next action.

START IMPLEMENTATION NOW. Do not stop at a high-level plan and do not ask for another giant audit. Respect the safety and verification gates above.
