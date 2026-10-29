# Shared Firebase local preview

The copied admin has two explicit launch modes. The existing isolated launcher continues to use `demo-aarvika-local`; the shared launcher targets only `gift4u-4210f`. Neither launcher deploys the application or changes Firestore by starting.

From the workspace root in PowerShell, point to the existing private environment file without copying it into this repository:

```powershell
$env:AARVIKA_SHARED_ENV_FILE = 'C:\Users\ASUS\Desktop\gift4u\.env.local'
npm --prefix existing-admin run dev:shared
```

Open `http://127.0.0.1:3100/admin/login`. The launcher passes only the required Firebase and ImageKit settings to the admin process. Keep the source file private; rotate any credentials known to have been exposed.

To preview the mobile published catalogue locally, start the admin first, then run `node apps/mobile/scripts/start-shared-api.cjs` from the workspace root. Open `http://127.0.0.1:8085`. Native devices and release builds require an HTTPS URL for the same read API; no HTTPS deployment is performed by these launchers.

For rollback, stop both shared processes and use the existing isolated admin launcher (`npm --prefix existing-admin run dev`). The shared mode performs additive reads and uses the existing authenticated admin write routes. No schema migration or data seeding is required. A published live change must be chosen and approved before an end-to-end write check.

## Current verification

- Existing `SUPER_ADMIN` email/password login against `gift4u-4210f`: passed; dashboard visible.
- Read-only Firestore counts: `products` 0, `skus` 0, `categories` 0, `collections` 0, `homepage_sections` 0.
- Public catalogue API and mobile shared preview: passed; no fixture products are projected into the real feed.
- Existing category-page CMS hero/banner and featured category/product selections now map into the mobile category screen. Homepage and taxonomy ImageKit URLs map into mobile sections and cards when records exist.
- Admin TypeScript and mobile TypeScript/lint: passed. Focused shared-mode tests: 3 admin, 4 mobile, and 1 mobile browser check passed.
- Live editor save, ImageKit image mapping from an existing record, and admin-to-mobile publication: pending an exact approved live item. No production write was attempted. Dedicated wedding tradition/function merchandising images still need a published record and a separate mobile mapping check.

## Files changed for this integration

```text
existing-admin/SHARED_FIREBASE_PREVIEW.md
existing-admin/package.json
existing-admin/scripts/isolated-env.cjs
existing-admin/scripts/run-shared.cjs
existing-admin/scripts/verify-shared-catalogue.cjs
existing-admin/scripts/verify-shared-login.cjs
existing-admin/src/app/api/admin/uploads/imagekit/route.ts
existing-admin/src/app/api/mobile/v2/catalog/route.ts
existing-admin/src/components/admin/catalog/VisualMediaEditor.tsx
existing-admin/src/components/admin/catalog/VisualUploadControls.tsx
existing-admin/src/components/admin/products/ProductEditor.tsx
existing-admin/src/instrumentation.ts
existing-admin/src/lib/catalog/mobile-projection.ts
existing-admin/src/lib/catalog/visual-publication.ts
existing-admin/src/lib/firebase-admin.ts
existing-admin/src/lib/firebase.ts
existing-admin/src/lib/shared.ts
existing-admin/tests/shared.test.ts
packages/catalogue/src/api-contracts.ts
packages/catalogue/src/contracts.ts
packages/catalogue/src/shared-api-adapter.ts
packages/catalogue/src/validation.ts
apps/mobile/e2e/shared-live-read.spec.ts
apps/mobile/scripts/start-shared-api.cjs
apps/mobile/src/app/(tabs)/account.tsx
apps/mobile/src/app/(tabs)/index.tsx
apps/mobile/src/app/(tabs)/(browse)/category/[id].tsx
apps/mobile/src/components/catalog-browser.tsx
apps/mobile/src/components/home-discovery.tsx
apps/mobile/src/components/visual-commerce.tsx
apps/mobile/src/config/environment.ts
apps/mobile/src/services/adapters.ts
apps/mobile/src/state/catalogue.tsx
apps/mobile/src/state/email-auth.tsx
apps/mobile/tests/shared-catalogue.test.ts
```
