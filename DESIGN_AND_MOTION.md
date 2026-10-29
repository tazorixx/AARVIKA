# AARVIKA — Compact Purple Design System and Motion Specification

Use supplied purple homepage screenshot and Amazon observational scan as **visual/behavioural research**, not exact measured Amazon CSS. Do not copy Amazon branding, assets or iconography.

| Token | Proposed value / rule |
|---|---|
| Primary | `#62298E` purple |
| Primary dark | `#3E155C` plum |
| Lavender | `#E9DDF7`, pale `#F7F0FF` |
| Pink / Peach | `#F4C6D9`, `#FFC5AF` |
| Mint / Cream | `#E6F5EF`, `#FFF1D9` |
| App base / surface | `#FAF8FC`, `#FFFFFF` |
| Typography | body 14–16sp; products 13–14sp; section headings 17–20sp; prices 17–19sp; scalable and tested for accessibility |
| Mobile grid | 2 product columns; category shortcuts up to 4 only if readable; responsive tablet grids |
| Spacing | card ~8–12dp; grid ~8–12dp, consistent scale 4/8/12/16/24 |
| Images | fixed ratio appropriate to category; skeleton reserves dimensions; no clipping or accidental stretching |
| Shapes | clean 10–12dp cards, light borders, restrained shadow; no giant gradient stacks |
| Major touch controls | accessible ≥approx. 44x44 logical px/pt target where feasible; text-scale test |
| Motion | press 120–200ms, sheets 180–280ms, navigation 220–350ms; composited animations, no scroll jank; reduced-motion path |

## Shared shell (all departments)
- Home / Categories / Offers / Wishlist / Account: five bottom tabs; Cart icon in header, dynamic cart quantity.
- AARVIKA logo/name as token, delivery location if useful, notifications only if backend has actual notifications.
- Search with suggestions, clear and category/culture/occasion/recipient/product matches; back navigation preserves typed term and filters.
- Home sections from configuration: header/search, editorial hero, all department icons, top categories, combo CTA, actual bestsellers, occasions, wedding quick paths, featured collections, new arrivals and valid offers; hide empty sections.
- PLP, PDP, search/filter sheet, cards, variants, wishlists, cart, checkout, personalization, combo and orders shared across all departments. Category-specific features live inside these layouts, not as clone components.
- Screens where bottom bar hides: full PDP depending on UX, combo builder, checkout/payment, full-screen photo preview; return restores state.

## QA against AI-overlarge layout
Do a visual pass with 320/360/390/414 device widths, a large font/accessibility test, Android navigation inset/keyboard, iPhone safe area and tablet landscape. Inspect section density, photo cropping, badges, price wrapping, disabled state, successful/failed state and performance. Don't declare the UI ready from a single design screenshot.
