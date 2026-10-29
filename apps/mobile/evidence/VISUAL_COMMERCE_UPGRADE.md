# AARVIKA visual commerce upgrade

Implemented against `78a52eb`, following the supplied master. Mobile/shared checkpoint: `4c70b30`; the following admin checkpoint adds publication metadata and final integration evidence. No dependency installation, production access, deployment or provider integration.

## Reused and preserved

Existing Expo SDK 58 app, router, eight departments, three-level taxonomy, source family counts, canonical product/SKU stock, ImageKit policy and Expo Image caching, demo illustrations, touch/reduced-motion behaviour, sheets, search/camera/location, wishlist/cart, personalization drafts, builders and inquiries. Existing admin shell, sidebar, navbar, dashboard, tables, fonts, spacing, components, routes, permissions and Lifestyle remain. No ninth mobile department.

No libraries installed: the existing image, motion, scrolling and sheet capabilities were sufficient. No need was demonstrated for a second carousel, bottom-sheet package, UI kit, FlashList, haptics or gradient dependency.

## Mobile implementation

One reusable typed renderer composes compact heroes, image-led shortcut rails, complete category grids, product rails, collection covers and editorial actions. Responsive fixed image frames use the existing cached/lazy renderer and contain/cover settings. Web listing filter/sort controls stick within their scroll area; native Search has persistent bottom filter/sort actions using the existing safe-area footer and sheet. No autoplay or continuous animation.

All eight departments now put visual browsing and products before optional specialist tools:

- Wedding: tradition, region and function tiles, recipient/budget discovery and products. Tradition pages lead with function tiles/products. Function pages lead with gifts; kit quantity/confirmation lives in “Plan this function”. Research notes, distinctions and family review remain in expandable guidance.
- Birthday: recipient, age, interest, budget, families and product browsing; the original combined gift finder remains optional.
- Anniversary: milestone/year and recipient discovery, keepsakes and collections; arbitrary-year filtering remains.
- Personalized: supported text/photo customization shortcuts open existing PDP editors; all nine families, engraving, preview/draft flows and builder remain.
- Hampers: ready-made/build-your-own paths, budget, all ten families, collections and the existing component-SKU builder.
- Clothing: audience, fabric/size tiles, eight source browsing axes and existing fit/colour/variant stock tools.
- Stationery: work/journaling/creative/school paths, all eleven families, product/specification discovery.
- Furniture: Home/Commercial visual discovery, eighteen families, products/concepts, custom/room-set inquiries and dimensional/material/finish filters. Inquiry-only products retain inquiry actions.

The directory and Main/Sub/Child pages use the same artwork system. Optional helpers retain their selections after first opening. Search deep links preserve department, category, recipient, age/year, budget and SKU attribute filters. Existing global header/navigation is reused once per screen. Legacy affected test selectors were adapted; their old screenshot suites were deliberately not rerun.

## Admin editing and publication

1. In the existing **Categories** or **Collections** editor, edit an existing record and expand **Mobile visual content · draft / publish**. Set display copy, local/ImageKit URL, description, framing and illustrated fallback. Save a visual draft and inspect its preview. Drafts stay private. **Publish saved visual** updates the connected mobile snapshot; **Rollback visual** restores a chosen immutable version. Category presentation is a fallback; explicit page-section copy/CTA/media takes precedence.
2. In the current **Homepage** editor, use **Mobile page key** and **Editing mobile page**. Targets include `home`, `department:wedding` (and the other seven IDs), `category:ID`, `tradition:ID`, `function:ID`, `collection:ID` and `shortcut:DEPARTMENT:KEY`. Set headline/subheading/image description/framing/fallback/CTA, source, visibility and order using existing controls. Draft preview is filtered by page. Existing publish/history/rollback semantics apply across these page sections.
3. Automatic source bindings include `@shortcuts`, `@families`, `@department`, `@collections`, `@functions`, `@regions`, `@recipients`, `@milestones`, `@interests`, `@budget`, `@fabrics`, `@sizes`, `@uses` and `@promo`. Manual product IDs and ordinary category/collection IDs remain supported. Use `@department` on department product rows; use explicit product IDs for specific function/tradition curation.
4. A shortcut tile's override uses its stable page key, e.g. `shortcut:birthday:recipient-her`, `shortcut:personalized:method-photo`, `shortcut:stationery:use-office` or `shortcut:furniture:sector-home`. A hero section supplies its cover/copy; its order/visibility controls placement. Category/collection imagery can instead be published directly on those records.

The guarded `existing-admin/scripts/seed-commerce.cjs` initialized 62 missing demo sections in one versioned publication, preserving existing sections/drafts, products and stock. It can be rerun safely for missing records. Newly published metadata is additive: optional `visual` fields and `commercePages` on existing catalogue contracts. Only published presentation fields leave the admin projection; draft/history/actor records stay private. Revision checks prevent stale edits. Real uploads stay disabled.

## Actual focused verification

| Check | Result |
| --- | --- |
| Mobile TypeScript and changed mobile/shared ESLint | Passed, no errors/warnings |
| Admin TypeScript / changed admin lint | Passed; 0 errors, 6 existing warnings; new preview controls lint clean |
| `tests/visual-commerce.test.ts` | 5 passed: all eight compositions, exact families/canonical identities, media/page validation, typed deep links, unsafe-route rejection |
| `e2e/visual-commerce.spec.ts` | 3 passed (10.1s): all eight 390px landings/product navigation, Wedding kit → builder → cart, 320px deep link and 768px Stationery |
| Shared filter-sheet / narrow-tablet final rerun | 1 passed (5.6s); native persistent actions type/lint checked, device runtime untested |
| Explicit fixture/admin-offline check | Passed (1 test, 10.7s). The eight-landing case blocks the admin API and asserts no admin requests; final transcript in `commerce/results/` |
| `existing-admin/scripts/verify-commerce.cjs` | Passed: real category GUI draft/preview/publish/rollback, private draft, connected mobile image refresh, stale revision and SUPPORT denial; page section title/order/publish/rollback/open-screen refresh, editor page selector and connected Furniture inquiry CTA |

The integration helper restored original category/page content after checking it. It caught and fixed the initial-load editing race and image-description precedence. Earlier browser selectors were adjusted for retained hidden navigation screens. The preview server stopped during an intermediate offline run; it was restarted in explicit fixture mode for the final check. Full suites, old admin 158 tests, platform exports and broad screenshot collections were not repeated.

Four representative references only:

- [Wedding before — reused previous evidence](../../../existing-admin/evidence/mobile-emulator/wedding-390.png)
- [Wedding after](commerce/wedding-after-390.png)
- [Furniture after](commerce/furniture-after-390.png)
- [Existing admin with compact media controls](commerce/admin-media-after.png)

## Limits and next action

Illustrations remain explicitly demo artwork; approved merchant photography has not been supplied. Publish approved public ImageKit URLs under the mobile-configured account to replace them. No live CDN performance or native frame-rate claim is made. Native runtime and real-device safe-area/footer, motion, scroll and cache QA remain unverified. The current admin draft preview shows presentation drafts, not a pixel-identical interactive mobile simulator. Real uploads, staging services and production deployment remain outside scope.

Exact tracked implementation/evidence files: [changed-files.txt](commerce/changed-files.txt). User-owned master instruction and environment example remain untouched/untracked. Keep isolation guards if reverting these feature commits.
