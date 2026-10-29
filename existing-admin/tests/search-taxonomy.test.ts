import assert from 'node:assert/strict';
import test from 'node:test';

import type { Product, TaxonomyBase } from '@/lib/catalog/types';
import {
  buildSearchTaxonomyMatches,
  expandSearchTerms,
  scoreSearchProduct,
} from '@/lib/search/catalog-search';

const product = (overrides: Partial<Product>): Product => ({
  id: 'p1',
  sku: 'SKU-1',
  title: 'Classic Gift Box',
  slug: 'classic-gift-box',
  shortDescription: '',
  description: '',
  categoryIds: [],
  occasionIds: [],
  recipientIds: [],
  tagIds: [],
  collectionIds: [],
  images: [],
  thumbnail: '',
  price: 999,
  mrp: 999,
  discount: 0,
  variants: [],
  personalization: { enabled: false },
  inventory: { quantity: 10, reserved: 0, sold: 0 },
  delivery: {},
  serviceability: {},
  status: 'live',
  featured: false,
  bestseller: false,
  newArrival: false,
  rating: 0,
  reviewCount: 0,
  seo: {},
  ...overrides,
});

const taxonomy = (id: string, name: string, slug: string): TaxonomyBase => ({
  id,
  name,
  slug,
  sortOrder: 0,
  active: true,
});

test('search matches products through real occasion and recipient relationships', () => {
  const terms = expandSearchTerms('birthday', {});
  const matches = buildSearchTaxonomyMatches({
    categories: [],
    occasions: [taxonomy('occ-birthday', 'Birthday', 'birthday')],
    recipients: [taxonomy('rec-wife', 'Wife', 'wife')],
    collections: [],
  }, terms);

  const birthdayGift = product({ occasionIds: ['occ-birthday'] });
  assert.ok(scoreSearchProduct(birthdayGift, terms, matches) > 0);
});

test('search matches typed merchandising tags without relying on product title text', () => {
  const terms = expandSearchTerms('18th birthday', {});
  const matches = buildSearchTaxonomyMatches({ categories: [], occasions: [], recipients: [], collections: [] }, terms);
  const taggedGift = product({ tagIds: ['age-group:18th-birthday'] });
  assert.ok(scoreSearchProduct(taggedGift, terms, matches) > 0);
});

test('search keeps synonym expansion and product relevance scoring', () => {
  const terms = expandSearchTerms('bday', { bday: ['birthday'] });
  const matches = buildSearchTaxonomyMatches({ categories: [], occasions: [], recipients: [], collections: [] }, terms);
  const namedGift = product({ title: 'Birthday Surprise Hamper' });
  assert.ok(scoreSearchProduct(namedGift, terms, matches) > 0);
});
