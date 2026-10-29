# Gift4U Search System Closure

The public `/api/search` route now ranks products using real catalogue relationships in addition to the existing title/slug/description logic.

Search still supports:

- managed synonyms
- managed redirects
- pinned products
- weighted relevance
- featured/bestseller/new-arrival boosts
- query analytics

It now also understands:

- active categories via `categoryIds`
- active occasions via `occasionIds`
- active recipients via `recipientIds`
- active collections via `collectionIds`
- typed `tagIds`
- `cultureTagIds`
- `stateTagIds`
- SEO keywords

No product relationship is inferred from a fake client-only category.
