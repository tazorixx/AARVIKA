# AARVIKA — Department-by-Department Completion Matrix

**Not done** until each checkbox is proved with actual functioning app and relevant test records. Refer to original PDFs, screenshots and Wedding/Furniture research in `references/` for child lists.

## Shared across ALL departments
- [ ] Global search, category navigation, correct deep links and restore-on-back
- [ ] Product listing, real product images, filters/sort and nonempty/no-result states
- [ ] SKU-aware detail page and correct price/variant/inventory behaviour
- [ ] Wishlist, add/remove cart, saved quantities, user state, cart badge
- [ ] Supported personalization/combos or accurately hidden unsupported features
- [ ] Delivery availability and returns/fulfilment policy as backed by real staging data
- [ ] Test checkout / order retrieval where purchasable; inquiry for quote-only
- [ ] Compact purple UI, all viewport checks, accessible motion/touch, error and retry states

## Wedding
- [ ] Religion/community (NOT same as state), region/state and tradition selection
- [ ] Relevant culture-specific and family-optional ceremony/function selection
- [ ] Ceremony essentials, outfits, jewellery, decor, gifts/return gifts and combos
- [ ] Product-need → eligible SKU mapping, compatible combo selection, bulk quantity
- [ ] Marathi, Gujarati, Punjabi Sikh/Hindu, Bengali, Tamil, Telugu, Kerala, Muslim, Christian and other reviewed source examples represented as templates (not universally mandatory)
- [ ] Custom wedding kit / function kit → cart tested; no unverified religious claims

## Birthday
- [ ] Shop by Category, Recipient, Budget, Interest, Personalized, Hampers/Combos, Milestones, Delivery, Trending, All
- [ ] Child/teen/first birthday, 18/21/25/30/40/50/60/70/80 plus arbitrary age
- [ ] Recipient and interest query combinations reflect correct listings
- [ ] Gift item personalization, hamper entry and valid shipping eligibility

## Personalized Gifts
- [ ] Drinkware, Stationery, Photo Gifts, Accessories, Home Décor, Wearables, Lifestyle, Jewellery, Create Your Own Combo (exact PDF)
- [ ] Photo/text/name upload, allowed fonts/designs and validations from SKU template
- [ ] User sees supported preview or explicitly marked template preview
- [ ] Add personalized order line; secure media association survives checkout

## Anniversary
- [ ] Category, recipient, milestone, personalized, hampers/combos, budget, interest, delivery, trending, all
- [ ] 1st/5th/10th/25th/50th anniversary label journeys plus arbitrary year
- [ ] Related gifts/sets and recipient browsing, saved filter state

## Hampers
- [ ] Birthday; Festival; Wedding & Engagement; Anniversary & Romantic; Corporate; Stationery; Self-Care & Lifestyle; Home & Décor; Baby & Kids; Custom (PDF exact 10)
- [ ] Every listed child category in PDF accessible and products correctly mapped
- [ ] Premade and build-your-own box; choose compatible SKUs across catalogue
- [ ] Quantities, packaging, note, restrictions, stock, recalculated price; cart/order snapshots

## Clothing
- [ ] Men, Women, Kids, Clothing Type, Style, Occasion, Trending/Collections, Deals/Budget (8 reference axes)
- [ ] Fabric, colour, size, fit, age, region/ethnic wear, outfit sets
- [ ] Variant pictures/stock/size chart and correct return information

## Stationery
- [ ] Notebooks & Diaries, Pens & Writing, School, Office, Planners, Art & Craft, Aesthetic, Desk Accessories, Packaging & Wrapping, Educational, Gift Sets (11 PDF families)
- [ ] All PDF child categories reachable
- [ ] Applicable paper size/ruling/pack/ink/point/age/format filters actually work

## Furniture
- [ ] Nine Home families and nine Commercial families as uploaded furniture master map
- [ ] Room/business navigation, subtype lists and filters dimensions/material/colour/configuration
- [ ] PDP includes actual size/material/assembly/delivery eligibility
- [ ] Room set/bundle where vendor-supported
- [ ] Custom furniture design request with dimensions/photo/budget and real saved enquiry status

## Ninth department
- [ ] Inactive/configurable only; no invented live category before explicit owner decision

## Overall APP READY gate (before existing admin changes)
- [ ] All eight sections above checked and evidence linked
- [ ] Staging seed data is clearly demo; no user-facing false merchant claims
- [ ] All shared flows work with staging backend contracts (not only component mocks)
- [ ] Checkout server verifies test payment, price and inventory, with cancel/fail/retry
- [ ] Secure user photos and account/order data, security rules and no embedded secrets
- [ ] Device screenshots/test runs, build/typecheck and regression suite recorded
- [ ] Product owner explicitly signs off opening admin-change work
