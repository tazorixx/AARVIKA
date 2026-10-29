# Gift4U Merchandising Subcategory Products API

Public endpoint:

`GET /api/merchandising/[page]/items/[slug]/products?limit=200`

Supported pages:

- wedding
- birthday
- anniversary
- hampers
- personalised
- lifestyle

The endpoint resolves an active CMS item, applies the parent page scope, applies the CMS item's authoritative product relationship, and returns:

- `page`
- `item`
- `products`
- `categories`
- `occasions`
- `recipients`
- `collections`

The current catalog remains capped at 200 live products, matching the existing public catalog behavior. The mobile UI therefore says `200 gifts shown` when it reaches the cap instead of claiming a total.
