# Gift4U P0.1 — SEO foundation + build unblock

This patch is applied on top of the current Gift4U application.

## Included
- Unblocks the current P3.3 TypeScript build errors.
- Restores `ProductDelivery.slotCapacities` and `zoneMode` compatibility.
- Adds site SEO helpers and JSON-LD.
- Adds sitewide Organization/WebSite schema.
- Adds product metadata, canonical URL, Open Graph/Twitter metadata and Product JSON-LD.
- Adds taxonomy metadata/canonical/schema for category, occasion, recipient and collection pages.
- Adds dynamic `sitemap.xml` and `robots.txt`.
- Adds custom 404.
- Adds `search` noindex metadata.
- Adds legal-page templates for terms, privacy, refund/cancellation and shipping.
- Fixes the duplicate-H1 condition in CMS taxonomy pages.

## Required before production
Set these environment values:
- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_COMPANY_NAME`
- `NEXT_PUBLIC_COMPANY_CIN`
- `NEXT_PUBLIC_REGISTERED_ADDRESS`
- `NEXT_PUBLIC_GRIEVANCE_OFFICER`

The legal pages deliberately contain clearly marked placeholders where business-specific facts are required. They should be reviewed before launch.

## Verification
After applying the patch to the full local project:

```bash
npm run build
```

Then manually verify `/robots.txt`, `/sitemap.xml`, a product page, a category page and an invalid URL.
