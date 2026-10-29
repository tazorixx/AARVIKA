# Gift4U P0.2 — Image Optimization

Converted the customer-facing CMS taxonomy images in `TaxonomyCms.tsx` from raw `<img>` elements to `next/image`.

- Hero image uses `fill`, responsive `sizes`, and `priority`.
- Featured category/product images use responsive `sizes`.
- Banner image uses `fill`.
- Existing layout/design preserved.
- Decorative banner image remains `alt=""`; hero now has meaningful alt text.

Next: run `npm run build`, then continue converting remaining customer-facing raw images in controlled batches.
