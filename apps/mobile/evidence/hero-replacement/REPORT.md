> Latest mobile compact revision: category heroes now measure 260px at a 390px viewport (200px photo + 60px caption), with smaller category cards and four grid columns where space permits. Homepage hero is 269px. The Shop action shares the caption row and keeps a 44px touch target. Verified all nine pages, no horizontal overflow, 320px Birthday layout and Shop navigation. Typecheck and focused ESLint passed. Changed home-discovery.tsx and visual-commerce.tsx only; no image uploads or backend changes. This supersedes the taller 4:3 mobile presentation below.

> Update: the subsequent owner-requested full-width adjustment supersedes the fixed 190/206px contained-frame description below. The mobile app now uses full-width 4:3 photos on phones and 8:3 on desktop, with copy below the image and no single-image counter. All nine phone pages and a desktop view passed focused sizing checks; typecheck and focused ESLint passed. Changed only home-discovery.tsx and visual-commerce.tsx. No new uploads or data changes.

# AARVIKA — owner hero replacement

Completed for the existing sample-data mobile preview (http://127.0.0.1:8086/) and local website (http://127.0.0.1:4173/). No production deployment and no Firebase record writes. The shared-catalogue preview on port 8085 retains its existing published configuration.

## Source and scope

ZIP: C:/Users/ASUS/Downloads/IMAGE 17.zip. Exactly 17 original PNG images were extracted read-only to .local-preview/hero17/originals. All were visually inspected in contact.jpg before mapping. The source ZIP and originals were not edited. The desktop/mobile pairs depict the same department, but are separate supplied compositions.

The existing ImageKit server uploader verified the exact configured Firebase project and verified SUPER_ADMIN identity before uploading. All 18 optimized outputs were uploaded (17 originals plus one furniture derivative), with stable hash filenames and overwrite disabled. ImageKit recompresses delivery bytes; CDN verification checked HTTP success, decoded dimensions and pixel similarity, while the existing uploader checked the original SHA-256 and stored file size. Upload receipts are retained locally in .local-preview/hero17/uploads.json.

## Mapping, dimensions, sizes and final public URLs

| Page / variant | Original ZIP image | Original dimensions | Original size | Optimized dimensions | Optimized size | Verified ImageKit file |
|---|---|---|---:|---|---:|---|
| home / desktop | IMAGE 01.png | 3392 × 1248 | 7640.8 KB | 1920 × 720 | 128.3 KB | [home-hero-desktop-ac3c8f9689.webp](https://ik.imagekit.io/gift4u4210/aarvika/merchandising/owner-heroes-20261028/home-hero-desktop-ac3c8f9689.webp) |
| home / mobile | IMAGE 02.png | 2400 × 1792 | 8231.7 KB | 1200 × 900 | 130.7 KB | [home-hero-mobile-4537d73982.webp](https://ik.imagekit.io/gift4u4210/aarvika/merchandising/owner-heroes-20261028/home-hero-mobile-4537d73982.webp) |
| wedding / desktop | IMAGE 03.png | 3392 × 1248 | 8080.7 KB | 1920 × 720 | 176.0 KB | [wedding-hero-desktop-4f311f48d6.webp](https://ik.imagekit.io/gift4u4210/aarvika/merchandising/owner-heroes-20261028/wedding-hero-desktop-4f311f48d6.webp) |
| wedding / mobile | IMAGE 04.png | 2400 × 1792 | 9304.3 KB | 1200 × 900 | 213.9 KB | [wedding-hero-mobile-d72d1eacc9.webp](https://ik.imagekit.io/gift4u4210/aarvika/merchandising/owner-heroes-20261028/wedding-hero-mobile-d72d1eacc9.webp) |
| birthday / desktop | IMAGE 05.png | 3392 × 1248 | 7133.6 KB | 1920 × 720 | 109.2 KB | [birthday-hero-desktop-5fad88947e.webp](https://ik.imagekit.io/gift4u4210/aarvika/merchandising/owner-heroes-20261028/birthday-hero-desktop-5fad88947e.webp) |
| birthday / mobile | IMAGE 06.png | 2400 × 1792 | 7584.5 KB | 1200 × 900 | 105.0 KB | [birthday-hero-mobile-a94ff7d3a0.webp](https://ik.imagekit.io/gift4u4210/aarvika/merchandising/owner-heroes-20261028/birthday-hero-mobile-a94ff7d3a0.webp) |
| anniversary / desktop | IMAGE 07.png | 3392 × 1248 | 6696.4 KB | 1920 × 720 | 88.4 KB | [anniversary-hero-desktop-8159489f3d.webp](https://ik.imagekit.io/gift4u4210/aarvika/merchandising/owner-heroes-20261028/anniversary-hero-desktop-8159489f3d.webp) |
| anniversary / mobile | IMAGE 08.png | 2400 × 1792 | 8254.7 KB | 1200 × 900 | 93.7 KB | [anniversary-hero-mobile-9f09c843f6.webp](https://ik.imagekit.io/gift4u4210/aarvika/merchandising/owner-heroes-20261028/anniversary-hero-mobile-9f09c843f6.webp) |
| personalized / desktop | IMAGE 09.png | 3392 × 1248 | 6704.7 KB | 1920 × 720 | 85.5 KB | [personalized-hero-desktop-9c94aa010c.webp](https://ik.imagekit.io/gift4u4210/aarvika/merchandising/owner-heroes-20261028/personalized-hero-desktop-9c94aa010c.webp) |
| personalized / mobile | IMAGE 10.png | 2400 × 1792 | 6672.4 KB | 1200 × 900 | 58.3 KB | [personalized-hero-mobile-72fdbf04b9.webp](https://ik.imagekit.io/gift4u4210/aarvika/merchandising/owner-heroes-20261028/personalized-hero-mobile-72fdbf04b9.webp) |
| hampers / desktop | IMAGE 11.png | 3392 × 1248 | 7863.0 KB | 1920 × 720 | 167.1 KB | [hampers-hero-desktop-a1306e59dd.webp](https://ik.imagekit.io/gift4u4210/aarvika/merchandising/owner-heroes-20261028/hampers-hero-desktop-a1306e59dd.webp) |
| hampers / mobile | IMAGE 12.png | 2400 × 1792 | 7930.8 KB | 1200 × 900 | 138.1 KB | [hampers-hero-mobile-badc925751.webp](https://ik.imagekit.io/gift4u4210/aarvika/merchandising/owner-heroes-20261028/hampers-hero-mobile-badc925751.webp) |
| clothing / desktop | IMAGE 13.png | 3392 × 1248 | 7306.5 KB | 1920 × 720 | 107.1 KB | [clothing-hero-desktop-65ea5cc988.webp](https://ik.imagekit.io/gift4u4210/aarvika/merchandising/owner-heroes-20261028/clothing-hero-desktop-65ea5cc988.webp) |
| clothing / mobile | IMAGE 14.png | 2400 × 1792 | 8510.8 KB | 1200 × 900 | 140.6 KB | [clothing-hero-mobile-b605606b3a.webp](https://ik.imagekit.io/gift4u4210/aarvika/merchandising/owner-heroes-20261028/clothing-hero-mobile-b605606b3a.webp) |
| stationery / desktop | IMAGE 15.png | 3392 × 1248 | 6652.9 KB | 1920 × 720 | 90.2 KB | [stationery-hero-desktop-fdd66b554f.webp](https://ik.imagekit.io/gift4u4210/aarvika/merchandising/owner-heroes-20261028/stationery-hero-desktop-fdd66b554f.webp) |
| stationery / mobile | IMAGE 16.png | 2400 × 1792 | 7133.0 KB | 1200 × 900 | 77.7 KB | [stationery-hero-mobile-e45b018d63.webp](https://ik.imagekit.io/gift4u4210/aarvika/merchandising/owner-heroes-20261028/stationery-hero-mobile-e45b018d63.webp) |
| furniture / desktop | IMAGE 17.png | 1696 × 624 | 1816.6 KB | 1696 × 636 | 74.8 KB | [furniture-hero-desktop-6d6026cab0.webp](https://ik.imagekit.io/gift4u4210/aarvika/merchandising/owner-heroes-20261028/furniture-hero-desktop-6d6026cab0.webp) |
| furniture / mobile (derived) | IMAGE 17.png | 1696 × 624 | 1816.6 KB | 1200 × 900 | 73.6 KB | [furniture-hero-mobile-b0deaefd86.webp](https://ik.imagekit.io/gift4u4210/aarvika/merchandising/owner-heroes-20261028/furniture-hero-mobile-b0deaefd86.webp) |

Original unique image bytes: **126,481,719**. Optimized delivery files, including the extra furniture derivative: **2,107,570**. Savings: **124,374,149 bytes (98.33%)**. Originals remain archived, so this is a delivery/storage-footprint comparison, not freed local disk space.

WebP quality 84, metadata stripped. Desktop outputs are 1920 × 720 except furniture, kept at its native 1696-pixel width with a 636-pixel canvas to avoid enlarging the lower-resolution source. Mobile outputs are 1200 × 900. No new dependencies or replacement artwork were used.

Furniture mobile uses IMAGE 17.png: crop left 660, top 0, width 1036, height 624, retaining the armchair, console and sofa; fit without distortion into a cream 1200 × 900 canvas. No 18th original was needed. The source's Gemini mark remains intact.

## Connected references

- Mobile fixture adapter: homepage hero and the leading hero section on each of the eight department pages. Only imagePath, mobileImagePath, imageAlt and imageFit are replaced. Existing titles, descriptions, buttons, order and visibility remain intact.
- Shared section contract: optional mobileImagePath, validated by the same safe-image rules as imagePath. Source selection uses the mobile image below 768px and desktop image at 768px and above.
- Mobile hero components: existing 190px home / 206px department frames remain. Contained media reserves room for existing copy so faces, cake, clothing and furniture are not covered by the footer. This intentionally leaves side space around portrait compositions. The department image helper uses only the allowlisted owner ImageKit URLs when no public endpoint is set.
- Website: the existing home hero and eight department listing heroes use picture/source responsive pairs. Existing category-detail, product, collection and editorial card images are unchanged.
- Existing assets such as hero-gifting.webp remain because occasion cards, gift-box and other editorial sections still use them. They no longer supply the nine targeted hero slots in this preview.

## Changed application files

- packages/catalogue/src/contracts.ts
- packages/catalogue/src/fixture-adapter.ts
- packages/catalogue/src/validation.ts
- packages/catalogue/src/hero-images.ts (new)
- packages/catalogue/src/fixtures/hero-images.json (new, public URLs only)
- apps/mobile/src/components/home-discovery.tsx
- apps/mobile/src/components/visual-commerce.tsx
- apps/mobile/src/components/local-demo-image.tsx
- apps/mobile/tests/hero-images.test.ts (new)
- apps/mobile/assets/editorial/: the 18 optimized files listed above
- apps/web/app.mjs
- apps/web/styles.css
- apps/web/assets/hero-images.mjs (new, public URLs only)

Preparation/upload/check scripts and originals are in .local-preview/hero17. Screenshots and check results are in this report's folder. Nothing in the 535-category pipeline, its checkpoints or manifests was modified. No existing Wedding merchandising records, admin editing code, product images, category thumbnails, collection records, secrets, Firebase environment settings or original Gift4U source files were modified.

## Verification

- CDN: all 18 uploaded images returned successfully and decoded to the expected dimensions and matching appearance.
- App: all 9 landing pages at 390px and 1280px, 18 checks. Correct responsive path, decoded nonzero image size, no failing hero HTTP responses, no opposite-size hero requested.
- Website: the same 18 checks, for 36 total landing-page/viewport combinations.
- node --experimental-strip-types --test tests/home-layout.test.ts tests/visual-commerce.test.ts: 8 passed.
- node --experimental-strip-types --test tests/hero-images.test.ts: 3 passed (unchanged layout/copy, responsive selection and safe-image validation).
- npm run typecheck: passed. npm run lint: passed. node --check apps/web/app.mjs: passed.
- Contact sheets: app-390-contact.jpg, app-1280-contact.jpg, web-390-contact.jpg, web-1280-contact.jpg. Individual screenshots and verification JSON are included alongside them.

Browser verification covers the web rendering of the app. Physical Android/iOS device verification was not performed. No other blocker requires action for this sample preview. Publishing these hero fields to live Firebase is not part of this fixture-mode replacement.

## Rollback

Remove the withOwnerHero mapping calls from the fixture adapter and restore the website's previous hero references; the prior assets remain intact. Restore only this task's responsive hero rendering additions if needed, without reverting unrelated existing work. Remote files were added with unique filenames; no old remote assets were overwritten or deleted.
