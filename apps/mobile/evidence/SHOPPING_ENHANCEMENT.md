# Mobile images, shopping search and delivery location

Focused enhancement against checkpoint `089f00f`, 26 October 2026. No admin redesign, production Firebase connection, original Gift4U modification, deployment, payment, courier, SMS or image-upload service.

## Reused

Existing ProductCard/ProductArt and PDP, five-tab navigation, shared header/search, typed catalogue adapters, ImageKit references, demo artwork, Expo image picker, account/address editor, profile-scoped AsyncStorage, purple/pastel theme and reduced-motion context. The catalogue's product/SKU identities, stock and price rules are unchanged. No new storage or recognition backend was built.

## Environment

Inspected `.env.local` by configuration names and presence only; no values were emitted. It already contained the requested `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`, `EXPO_PUBLIC_IMAGEKIT_URL_ENDPOINT`, Firebase Storage Bucket and Messaging Sender ID names. No legacy `NEXT_PUBLIC_FIREBASE_*` duplicates or requested old aliases remained, so no rewrite was necessary. Existing Expo Firebase values, fixture development mode and API URL were preserved. `.env.local` remains Git-ignored and no private keys/passwords were copied. The owner's untracked `.env.example` was left untouched.

## Images and compact cards

- Installed only SDK-compatible `expo-image ~58.0.17` and `expo-location ~58.0.19`. Expo selected these versions. Its workspace-hoisting installer failed after installation; the existing mobile lockfile/install was completed with workspaces and lifecycle scripts disabled. No Expo downgrade or existing dependency version change was committed.
- Shared media validation and the existing admin projection/parser now accept public HTTPS `ik.imagekit.io` references as well as safe local demo paths. This minimal adapter change was necessary because the previous projection discarded every ImageKit URL. Admin UI/template/upload behaviour was not changed. Server requests remain isolated; no server fetch to the CDN was introduced.
- The mobile renderer trusts only the configured ImageKit account. It adds deterministic width/height bounding boxes, `c-at_max`, `f-auto`, quality 80 (90 for zoom), preserves unrelated query parameters and leaves unrelated URLs unchanged. Non-ImageKit network images are not newly enabled.
- Responsive size buckets use actual rendered width and device pixel ratio, capped at 200px for category use, 450px grid, 1000px detail, 1200px hero and 2000px zoom. Width and height are bounded; `contain` preserves the entire item. Existing local category icons remain bundled assets.
- Zoom downloads start only after opening the existing PDP's new image sheet. Product image selection and variant-art behaviour remain. Signed URLs are not modified: unbounded signed originals are refused for ordinary cards/details and can load only on demand in zoom; pre-sized signed variants may be used within the bounds.
- `expo-image` uses `memory-disk`, URI cache/recycling keys, restrained transitions with cache-hit/reduced-motion handling and neutral placeholders. Browser IntersectionObserver/native viewport checks defer offscreen requests. Near-visible first-row/hero images receive high priority. Native prefetch is limited to two likely next images with a bounded deduplication set; browsers use their lazy loader and HTTP cache.
- Existing two-column phone grids, wishlist, product navigation, prices and working shopping controls remain. Images fill a stable frame without cropping or layout shifts. Variant counts are visible; no unsupported discounts, ratings or sales were added.

Native cache hits, disk persistence and Android frame rate were not measured on a device. Web caching depends on browser/CDN headers; the deterministic intercepted-CDN test proves stable URL/cache identity, not live CDN cache performance.

## Search and visual search

The existing header/search gained a camera action and compact search controls, debounced typed service reads, suggestions, locally persisted bounded recent searches with clear, active catalogue category navigation, existing filters and empty/loading/retry states. Categories are labelled “Explore categories”; no popularity statistics are invented.

Visual search is **UI/provider interface only**. No genuine engine/descriptors were available. Existing Expo image picker supports camera/gallery, permission denial, preview, removal/replacement and cancellation recovery. Photos remain in temporary local memory/device picker storage, never AsyncStorage or an upload. Remote photo links are refused. The provider explicitly reports “image matching is not configured”; no matches, scores or paid AI requests are fabricated.

## Delivery location and Google Maps

The header displays the selected local delivery address. A compact location route supports saved-address selection/edit/removal and the existing account editor reuses the same form. Home/Work/Other, recipient, phone, flat/house, building/street, landmark, locality, city/state/PIN and optional coordinates are persisted in the existing local demo profile. Selecting/editing an address updates the header and survives reload. No customer data is synchronized to Firebase.

Web Google Maps/Places loads only after pressing “Use Google Maps”, with an explicit notice that searches/map requests go to Google. It supports autocomplete, postal-field population, a selectable/draggable pin, current position after foreground permission, confirmation and manual entry. Manual fields remain available for offline, denied permission, disabled APIs, invalid/restricted key or load errors. Current position alone does not invent postal fields or delivery eligibility.

**Actual key probe on `http://127.0.0.1:8085`:** Maps script HTTP 200; Places widget created; city autocomplete/details requests returned HTTP 200; selection populated the city; map pin selection worked. No Google API diagnostic or network-failure code was observed. Only a non-personal city query was used; no address was saved by this probe. Cloud Console restrictions were not queried or changed. These results establish this browser origin only, not every origin or native platform. Initial sandbox networking failed; the permitted outside-sandbox probe succeeded.

Native Android/iOS currently use foreground GPS/manual fallback, **not a native Google map**. No restricted web key was put in native SDK configuration. Native Google Maps requires an SDK-compatible map renderer, chosen Android package/SHA-1 and iOS bundle ID, appropriate platform-restricted keys/API authorization, and a rebuilt development client with camera/location permissions. No APIs/billing were enabled automatically. See [Google's application restriction guidance](https://developers.google.com/maps/api-security-best-practices#restricting-api-keys).

## Targeted verification only

| Check | Actual result |
| --- | --- |
| Mobile TypeScript | Passed (`tsc --noEmit`) |
| Changed mobile TS/TSX/scripts/tests ESLint | Passed, 0 errors/warnings; final four changed image/privacy files also passed |
| Minimal admin adapter/parser TypeScript and two-file ESLint | Passed; no admin unit/browser suite rerun |
| Shared media policy/validation ESLint | Passed using the existing local-API config |
| `tests/shopping-enhancement.test.ts` | 4 passed, 0 failed: trust boundaries, bounded/signed URLs, local recent searches, coordinates/postal components |
| `e2e/shopping-enhancement.spec.ts` | 3 passed: text search/recents/camera/gallery/no uploads; permission denial/Places/pin/local address save/edit/reload; Maps failure/manual fallback |
| Final picker/privacy-only rerun | 1 passed |
| `scripts/verify-shopping-images.cjs` | Passed: isolated admin reference → grid/PDP; 320/390px bounds/contain/no overflow; thumb/detail/zoom requests; stable URL identity; error fallback; original media restored |
| Existing live Maps key | Script and Places HTTP 200, populated city, selectable pin; manual form retained |
| Native runtime / native exports / old full suites | Not run, deliberately outside this focused verification |

The emulator image check temporarily changed one synthetic seeded product reference, intercepted that CDN response with bundled **demo** artwork, then restored the original media. There were no existing approved remote ImageKit asset references in the seeded catalogue. This proves transport/rendering/size/error handling; it does **not** certify a real merchant asset, live CDN response, native disk caching or performance benchmarks. A real approved asset URL is still needed for that final CDN-specific check.

A browser check initially exposed mojibake in new location labels; the labels were corrected and the location/full focused cases rerun successfully. No critical test remains failed. Detailed small transcripts: [shopping-enhancement](shopping-enhancement/). Exact source/evidence paths: [changed-files.txt](shopping-enhancement/changed-files.txt).

No all-department capture collection, old 158-test admin suite, unrelated browser suites, Android/iOS/web exports or deployment was repeated. Existing npm-reported five high-severity advisories were not force-fixed in this focused change.

## Run and remaining setup

From `apps/mobile`: `node scripts/start-expo.cjs --web --offline --port 8085` uses the unchanged fixture default. Google Maps is an explicitly requested online feature even when Metro is started with `--offline`; the manual selector works without it. For existing isolated admin media use its guarded emulator/dev commands and `node scripts/start-admin-emulator.cjs`; the focused image script expects an opt-in admin-emulator Expo session on 8086 and admin on 3100.

Strictly remaining: provide one approved existing ImageKit product asset for a live CDN check; configure platform-specific native Google Maps if desired, then rebuild/test camera/location/image cache on a device. Current web Maps works with the existing key on the tested origin. No production Firebase or other provider integration is required for these local/demo flows.

Implementation references: [Expo SDK 58 Image](https://docs.expo.dev/versions/v58.0.0/sdk/image/), [ImagePicker](https://docs.expo.dev/versions/v58.0.0/sdk/imagepicker/), [Location](https://docs.expo.dev/versions/v58.0.0/sdk/location/), [ImageKit transformations](https://imagekit.io/docs/image-transformation), [Places widget](https://developers.google.com/maps/documentation/javascript/place-autocomplete-new).

## Runtime correction after device-console feedback

Removed the literal JSX space between search controls and moved MotionContext to a shared state module, breaking the ui/image import cycle without changing reduced-motion behaviour. The previous browser check observed page exceptions but missed React Native Web console errors; it now fails console errors and require-cycle warnings too. Mobile TypeScript and lint on the five affected source/test files passed. The focused text-search/recents/camera/gallery browser case passed (1 test, 4.9 seconds) with no captured console errors, require-cycle warnings, page errors or unexpected external requests. No full suite or exports were repeated.
