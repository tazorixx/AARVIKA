# AARVIKA admin guide for the catalogue team

Prepared 29 October 2026 from the existing AARVIKA admin implementation. This guide explains the current fields and buttons; no live product or category was created while preparing it.

## 1. Read this before starting

**Use the admin to create real catalogue content. Use the connected catalogue app to check it.**

| Purpose | Address on the owner's computer | What it shows |
|---|---|---|
| Admin login | http://127.0.0.1:3100/admin/login | Product, category, image and merchandising editors |
| Connected catalogue app | http://127.0.0.1:8085/ | The published catalogue from the shared backend |
| Sample-design app | http://127.0.0.1:8086/ | Sample products and the design preview; admin edits do not update these fixtures |

These are local addresses. On your friend's computer, `127.0.0.1` refers to your friend's own computer. It will not open the owner's app. Friends need an owner-arranged, securely accessible admin address or access on the owner's machine. A hosted team admin address has not been established by this guide. Do not distribute environment files, Firebase service-account files, ImageKit private keys or the owner's password.

The owner should arrange a separate authorized account for each contributor, normally with the catalogue-management role needed for this work. A Firebase customer account alone does not grant admin access. Only the owner should arrange permissions. Complete genuine email verification if required. Do not try to work around a permission or verification error.

Before saving anything, confirm that the admin is in the intended shared environment, **gift4u-4210f**, rather than the isolated emulator. Some product-editor explanatory text still says “demo”; that wording alone is not a reliable environment indicator. Ask the owner if the environment is unclear.

The newly supplied 17-image hero set is connected to the sample preview and uploaded to ImageKit. That does not mean its references have already been published into the real Firebase merchandising records. Existing public URLs are listed in `apps/mobile/evidence/hero-replacement/REPORT.md`; reuse them when the owner assigns hero publication instead of uploading duplicates.

## 2. Understand the different records

| Item | Meaning | Example | Admin location |
|---|---|---|---|
| Department | One of the eight main shopping areas | Clothing | Product department selection / Merchandising |
| Main category | Top level of the actual category tree | Clothing | Catalog → Categories |
| Subcategory | A category under its parent | An approved clothing family | Catalog → Categories |
| Child category | A more specific category under a subcategory | An approved child of that family | Catalog → Categories |
| Product | One sellable item with its own information | A particular cotton kurta design | Catalog → Products |
| SKU | One stock/price choice of that product | Medium / Cream | Product variant configuration |
| Collection | A curated grouping of existing products | A particular gifting collection | Catalog → Collections |
| Merchandising card | A visual shortcut to a category, occasion or collection | A “For Her” card | Merchandising → department |
| Hero | The large image/banner at the top of a landing page | Birthday celebration banner | Merchandising → Birthday |

**A thumbnail is not a hero. A merchandising card is not a product. Uploading an image does not by itself publish the record using it.**

Keep all eight departments: Wedding, Birthday, Anniversary, Personalized Gifts, Hampers, Clothing, Stationery and Furniture. Do not create a ninth department. Search the existing categories before adding anything. Follow the approved category list and its exact parent/child names; do not invent an extra hierarchy level. Existing root records count as the first category level in the current editor.

## 3. Prepare each assignment before opening the editor

The owner gives each friend a department or a list of exact category/product IDs. Avoid two people editing the same record simultaneously.

For a category, collect:

- Approved name and existing ID, if it already exists.
- Department and parent category.
- Short description and display order.
- One relevant thumbnail and a short description of the image.
- Hero/banner images only if this category also needs a dedicated page presentation.

For a product, collect:

- Product title, unique SKU and URL slug.
- Correct department and complete category path.
- Short description and full factual description.
- Actual selling price, MRP where applicable, and confirmed stock quantity.
- Each size/colour/pack combination, its SKU, price and stock.
- Product photos: front, alternate angle, detail and size/scale where useful.
- Material, dimensions, care instructions and department-specific specifications.
- Whether it is purchasable, customizable, a hamper component or a furniture inquiry.
- Any verified return, delivery or personalization information the editor requests.

Do not invent stock, discounts, reviews, ratings, supplier promises or delivery dates. A lifestyle inspiration photo should not misrepresent what a customer receives.

Image preparation:

- Use the owner's approved images or supplier images you have permission to use.
- Category/collection thumbnails: use a clear square crop, preferably around 800–1200px.
- Product photos: keep the whole item visible; use consistent backgrounds and sharp detail. Around 1200px on the main dimension is a practical starting point.
- Existing hero assets: desktop approximately 1920 × 720; mobile approximately 1200 × 900. Furniture has an approved derivative from its desktop image. Reuse the optimized files, not the large originals.
- WebP, JPEG and PNG are supported by the inspected image controls. Prefer the already optimized files. The product/category ImageKit route caps files at 10 MB; other upload controls may impose their own checks. Treat the UI's error as authoritative.
- Use clear filenames such as `cream-kurta-front.webp`; never rename an unrelated image to make it appear relevant.

## 4. Add or correct a main category

1. Sign into the admin.
2. Open **Catalog → Categories**.
3. Search the exact name and check the department and parent. If it already exists, click **Edit**; do not recreate it.
4. For a new record, use the create form.
5. Fill **Name** with the approved name.
6. Set **Slug**, or leave it blank to let the category editor generate one. Use readable lowercase words separated by hyphens when entering it yourself. Avoid changing established slugs casually.
7. Set **Mobile department** to the correct department. Do not leave a new AARVIKA category under “Legacy / Lifestyle (preserved).”
8. Set **Parent category** to **Top-level category** only if this is genuinely the approved root/main record and no corresponding root exists.
9. Fill **Description** and **Display order**. Smaller order values should be reviewed in the displayed list; the list also has up/down controls.
10. For Furniture, select **Furniture sector** where appropriate: Home, Commercial, or inherited/not specified.
11. The basic **Image URL** field is optional. Use an existing approved public ImageKit URL if available, or add the image through the visual editor after creation.
12. Click the create button. Confirm a success result and find the saved record in the list.
13. Record its ID or edit-page reference in your task log. Do not assume an automatically created ID matches a previously prepared category-ID list.

Category master creation is a normal save, not the same draft workflow as the visual editor. Only create owner-approved taxonomy records.

## 5. Add a subcategory or child category

1. Stay in **Catalog → Categories**.
2. Search first to avoid duplicates with slightly different spelling.
3. Enter the approved name, slug and description.
4. Select the same **Mobile department** as the parent.
5. Use **Find parent category** to narrow the list.
6. For a subcategory, choose its approved main/root category in **Parent category**.
7. For a child category, choose its approved subcategory as the parent.
8. Set display order and save.
9. Reopen the record and confirm the parent is correct.
10. Add its own image using the next section. A child's image is configured on the child record, not on its parent.

Never duplicate a root simply because its products are not visible yet. If a parent is absent, report it or create only the specifically assigned missing parent first.

## 6. Add a category, subcategory or child thumbnail

These steps are identical at all three levels.

1. Find the correct category in **Catalog → Categories**, then click **Edit**.
2. Expand **Mobile visual content · draft / publish**. This section appears for an existing saved record.
3. Fill **Display title** and **Short subtitle** only if the assignment calls for them.
4. Under **Images from ImageKit**, click **Upload thumbnail**.
5. Select the correct optimized image and wait for upload completion. The editor should fill its public image reference and show a preview.
6. Alternatively, paste an already approved public ImageKit URL into **Mobile image URL**.
7. Fill **Mobile image description** with what is actually pictured, for example “Cream cotton kurta with embroidered neckline.”
8. Set **Image fit**: **Full item · contain** for an item that must remain fully visible; **Lifestyle · cover** for a photographic crop. Inspect the preview rather than choosing blindly.
9. Click **Save visual draft**.
10. Inspect the saved preview. Check subject, crop, spelling and parent record.
11. When approved, click **Publish saved visual**.
12. Wait for the confirmation, then check the connected app on port 8085.

The basic **Save changes** button and the visual editor's draft/publish buttons are separate. Saving the basic category fields is not a substitute for publishing its visual draft. If you edited both, save the basic changes and also complete the visual draft/publish sequence.

To replace an image, upload or select the new image, save its draft, then publish it. Do not delete the old remote image as part of routine content entry. It may be used elsewhere. The visual editor also offers **Visual rollback version** and **Rollback visual** for recovering a previous published visual.

## 7. Add category-page banners or a hero gallery

There are two related controls; use the one assigned by the owner.

**Gallery attached to category visual content:**

1. In the category's visual editor, click **Add hero image**.
2. Upload an image and fill its **Hero 1 description** (or the matching number).
3. Repeat only if a real multi-image gallery is required; the current control allows up to five images.
4. Remove an accidental duplicate from the draft.
5. Click **Save visual draft**, review, then **Publish saved visual**.

**Dedicated category-page presentation:**

1. While editing the category, click **Edit this category page: banners and featured selections**.
2. Confirm the correct category is selected in the **Pages** list.
3. Edit **Hero title**, **Hero description**, **Hero image**, **Banner title**, **Banner description** and **Banner image** as assigned.
4. Use **Upload image / Replace image**, or **Reuse an existing public ImageKit URL**.
5. Select **Featured products** only from real live products. The editor allows up to 20.
6. Select **Featured categories** where needed.
7. Set **Display order** and **Active**.
8. Click **Save changes** and verify the connected app.

This page has a save/active workflow, not the visual editor's separate publish button. Saving an active presentation can affect the storefront immediately. Do not populate both systems with competing hero choices without checking which presentation is currently used on that page.

## 8. Change an entire department's hero

1. Open **Merchandising → Wedding / Birthday / Anniversary / Personalized Gifts / Hampers / Clothing / Stationery / Furniture**.
2. Find the department's **hero** panel.
3. Preserve **Eyebrow**, **Heading**, **Description**, **CTA text** and **CTA link** unless the assignment includes copy changes.
4. Upload or replace **Desktop image** with that department's desktop hero.
5. Upload or replace **Mobile image** with its mobile hero.
6. For the supplied Furniture set, use the already prepared furniture-mobile derivative; do not wait for another original.
7. To avoid duplicate uploads, use **Reuse an existing public ImageKit URL** for the already uploaded 17-image collection. Match the department and desktop/mobile suffix exactly.
8. Review the preview and click **Save hero**.
9. Check the department in the connected app on phone and desktop widths.

**Save hero is a save action, not a separate approval draft.** Coordinate this change with the owner before saving. Do not overwrite the preserved Wedding tradition/function cards while replacing only a department hero.

## 9. Add a visual shortcut card in a department

1. Open the department under **Merchandising**.
2. Choose the appropriate existing section/tab, such as a recipient, category, collection or featured section. The available sections differ by department.
3. Click **Add …** for that section.
4. Fill **Name**, **Subtitle**, **Description** and **Display order**.
5. Where **Catalogue category / recipient / occasion / collection** appears, choose **Select existing** and select the intended master record.
6. Use **Create here** only if an approved master record really is missing. For a category, set **Place under** correctly. This creates the master record and the presentation together.
7. Upload the card's **Image** or reuse its approved ImageKit URL.
8. If the section supports featured products, select the appropriate existing products.
9. Review the inline preview.
10. Leave **Published on storefront** unchecked while preparing an unapproved item. Once approved, enable it and click **Create item** or **Save changes**.
11. Verify that tapping the card opens the intended category or listing.

Do not create an extra product just to make a shortcut card. Link the card to the correct existing record.

## 10. Add a new product — complete sequence

### A. Create the product information

1. Open **Catalog → Products**.
2. Search for the product title and SKU. If this exact product already exists, edit it.
3. Click **Add Product**.
4. Under **Basic information**, fill **Title**, **SKU** and **Slug**. These product fields are required in the current form. Use a unique, stable SKU and a readable slug.
5. Fill **Short description** with one clear factual sentence.
6. Fill **Description** with what is included, material, size, finish, care and any relevant limitations.

### B. Connect it to the AARVIKA catalogue

7. Find **AARVIKA catalogue** and enable **Enable AARVIKA catalogue configuration** if not already enabled.
8. Tick the relevant **Departments**. A product may appear in more than one appropriate department without being duplicated.
9. Enter **Product type**, using the established type for similar products.
10. Choose **Purchase mode**. Use the buy mode for an actual sellable item. Furniture that requires a custom quote should use the inquiry-only mode.
11. Under **Canonical category · Main → Subcategory → Child**, choose the complete approved path. Choose the deepest suitable category that actually exists.
12. Use **Search additional category placements** only for genuinely relevant extra placements. Keep one product and one stock authority.
13. Fill **Material**, **Color** and **Style** where applicable.
14. Use the **Taxonomy** choices to attach existing occasions, recipients and collections as appropriate.

### C. Set price and stock

15. Under **Pricing**, enter the actual **Price**. Rupee fields use rupees: enter `499` for ₹499, not `49900`.
16. Enter a genuine **MRP** if applicable. Do not invent an inflated MRP or discount.
17. For a product with no variants, enter its confirmed **Quantity** under **Inventory**.
18. Do not manually edit **Reserved** or **Sold**. These are operational quantities, not free stock to allocate again.
19. For multiple sizes/colours/packs, follow the variant steps below instead of duplicating the whole product.

### D. Add the photographs

20. In the product media area, click **Upload image**.
21. Select the main photograph and wait for the visible uploaded preview.
22. Upload the alternate/detail photos one at a time. Uploading alone does not save the product form.
23. The first uploaded photo becomes primary initially. Use **Make primary** to choose the intended catalogue-card image.
24. Use **Move left / Move right** to order the gallery. Use **Remove** only for an incorrect reference in this product.
25. Inspect every photo: correct item, colour, sharpness, no unrelated supplier watermark, and consistent presentation.

### E. Fill department details

26. Complete **Department specifications** for the selected department; see the checklist below.
27. Configure personalization only if the item genuinely supports it.
28. Set hamper/kit eligibility only if this item is an approved component.
29. Enter delivery/returns data only from confirmed business information. Do not change payment, courier or SMS settings as catalogue-entry work.

### F. Draft, review, publish

30. Keep **Publishing → Status** as **Draft** during preparation.
31. Click **Save as draft**. If validation fails, fix the exact fields named in the error; do not repeatedly create new copies.
32. Reopen the saved product and check that images, category, price and variants persisted.
33. Click **Preview product** and review it.
34. Send the saved product reference to the assigned reviewer.
35. After approval, change **Status** to **Live**.
36. Click **Update Product** for the saved record, or **Create Product** if still on a new form.
37. Wait for confirmation, then check port 8085. Test the category listing, product details, image gallery, variant prices and stock presentation.

Publishing catalogue content does not by itself establish that live checkout, payments or fulfilment are ready. The current sample app explicitly remains a demo purchase flow.

## 11. Add sizes, colours and other variants

1. In the product's variants section, use **Add variant** for each actual sellable combination.
2. Use a readable name/value, such as a confirmed Medium / Cream combination.
3. In **Variant SKU prices and stock**, give every combination its own unique **SKU code**.
4. Enter that variant's **Price (₹)** and **Total SKU quantity**.
5. Expand **Combination attributes · size, colour, fabric and more** and fill the applicable fields: Size, Colour, Fit, Fabric, Material, Finish, Pack.
6. Do not give two combinations the same SKU. Do not put the total quantity for all variants into each individual variant.
7. Check every variant after saving: correct label, price and stock. An unavailable option should have actual zero availability, not an invented positive quantity.

Example only: one kurta product can have Medium/Cream and Large/Cream SKUs with different prices and stock. Do not enter the example's values as real inventory; use the supplier-confirmed values.

## 12. Department-specific checklist

| Department | Information to check before publishing |
|---|---|
| Wedding | Relevant tradition/function, kit contents and component quantities; do not claim universal religious requirements; preserve existing Wedding merchandising records |
| Birthday | Recipient, age group, occasion and relevant interests; correct product category |
| Anniversary | Recipient and appropriate milestone; no unsupported delivery promise |
| Personalized Gifts | Technique, surface, allowed text/photo inputs, required fields and preview instructions |
| Hampers | Real component SKUs, quantities, packaging, message limits and approved component eligibility; do not invent separate duplicate stock |
| Clothing | Audience, type, fit, fabric, size/colour combinations, care and accurate size information |
| Stationery | Type, paper size, GSM, sheets, ruling, ink/point/refill, pack count and other applicable specs |
| Furniture | Home/Commercial sector, family, dimensions with units, material, finish, assembly and purchase versus inquiry mode |

Fill only applicable specifications. Do not use placeholder text just to fill every field. For kits or personalization forms you do not understand, save the record for owner review rather than configuring a guessed flow.

## 13. Collections and homepage placement

**Collection:**

1. Open **Catalog → Collections** and search before creating.
2. Create or edit the approved collection's name, slug, description and order.
3. For its thumbnail, use the same **Mobile visual content · draft / publish** workflow as categories.
4. Assign the intended collection to each relevant existing product in its **Taxonomy** section, then save that product.
5. Add the collection to a department or homepage presentation only if assigned. A collection record alone does not guarantee a homepage placement.

**Homepage:**

1. Open **Content → Homepage**.
2. Confirm **Editing mobile page** is the page you intend to change, normally `home`.
3. Edit the existing section rather than creating a duplicate. Use **New section** only when a new section is approved.
4. Choose **Type**, then fill **Title**, **Subtitle**, **Image URL / Upload image**, **Link URL**, **Button label** and **Sort order** as applicable.
5. Set the section's product/category/collection source in its source controls. Use real live product IDs, not sample-preview IDs.
6. Set **Active** appropriately.
7. Click **Save draft** for each changed section.
8. Click **Preview drafts** and check the entire page order, not just your section.
9. Coordinate with other editors before **Publish saved layout**, because it publishes all saved layout drafts, including other people's pending work. Use a section's **Publish now** only when that is the intended scoped action.
10. Check the connected app. The editor provides **Homepage rollback version** and **Rollback published layout** if an approved rollback is required.

The current homepage editor exposes a single Image URL for each section; do not assume that it has the department hero panel's separate Desktop/Mobile image fields. If an assignment needs a responsive pair that the screen cannot represent, ask the owner/developer to handle that mapping rather than overwriting unrelated fields.

## 14. Confirm that the work actually appears

1. Check the save/publish confirmation in the admin. A spinning upload or unsaved form is not a completed task.
2. Open **http://127.0.0.1:8085/** on the owner's computer, not 8086.
3. Refresh. The shared catalogue reader normally refreshes about every 30 seconds while active, and on returning to the app.
4. Open the correct department, category and product.
5. Check thumbnail, hero, image gallery, title, price, variant selection and availability.
6. Tap the shortcut/card and confirm its destination is correct.
7. Check one narrow phone view. Ensure the product, not merely an image URL in admin, is visible.
8. Record the category/product ID, page checked, result and any issue in the work log.

If a product or image is absent, check in this order:

| Symptom | First checks |
|---|---|
| Nothing changed | Are you on 8085 rather than fixture preview 8086? Is the admin/shared server running? |
| Product absent | Is Status Live, is AARVIKA configuration enabled, and is the category/department path correct? |
| Category absent | Correct department, active record, correct parent and no duplicate root? |
| Image absent | Upload completed, correct public ImageKit URL, visual draft published or active CMS record saved? |
| Homepage item absent | Correct page, Active enabled, section source valid and saved layout/section published? |
| Featured selection empty | Are there eligible real live products? Do not select sample IDs from the preview. |
| Upload permission error | Verify login, assigned role and genuine email verification; send the error to the owner. |
| Duplicate slug/SKU error | Search and edit the existing record or obtain an approved unique code; do not repeatedly resubmit duplicates. |
| Conflict/revision error | Another editor may have saved first. Reload, compare current values and reapply only your intended edit. |
| Field cannot be changed | It may be derived or locked after setup; ask the owner rather than editing Firebase directly. |

Some supplied images have upload receipts or staged mappings without corresponding approved category records. A completed image upload is not proof that every category exists or is connected. Use the real admin list and exact stable IDs; do not rerun the 535-image pipeline or import its entire list as part of manual entry.

## 15. Team workflow and completion log

Recommended division:

- Owner: permissions, approved category structure, prices/stock source and final publishing scope.
- Catalogue editor: create/edit records and save drafts for assigned IDs.
- Image editor: prepare/upload relevant images and save visual drafts.
- Reviewer: check the saved record and approve publication.
- Assigned publisher: publish only reviewed work, then verify the connected app.

One person can do multiple roles, but there should be only one active editor per record. Start with one category and one product, verify the complete path, then continue in small batches. Do not give a new contributor hundreds of live changes before the first complete example is checked.

Use this log in your shared work document:

| Department | Record type | Existing/new ID | Name | Parent/category | Images checked | Price/SKU/stock checked | Draft saved | Reviewer | Published | App checked | Issue |
|---|---|---|---|---|---|---|---|---|---|---|---|
| | | | | | | | | | | | |

A task is complete only when the saved record, published state where requested, and connected-app display are all checked. Report missing information honestly instead of filling guessed values.

## 16. Short instructions to send with the assignment

“Please work only on the assigned AARVIKA department and record IDs. Search before creating duplicates. Add approved category/subcategory images using the visual draft/publish controls. Add products with their correct category path, real photos, unique variant SKUs, verified prices and stock. Save drafts first and send them for review. Do not publish another person's drafts, edit existing Wedding records, change accounts or settings, run the bulk image worker, or delete remote files. Check approved published changes in the connected app on 8085, not the sample preview on 8086. Send the completed log with the IDs and any unresolved errors.”

## Basis and limits of this guide

Button names and flows were checked against the current AdminNav, TaxonomyManager, VisualMediaEditor, VisualUploadControls, ProductEditor, AuthoringPanel, DepartmentFields, MerchandisingManager, TaxonomyPageManager and Homepage editor source. Historical integration reports were used only for context, not as current inventory counts. No new live write or account-permission test was performed for this guide. No application code, Firebase data, roles, uploads or deployments were changed.
