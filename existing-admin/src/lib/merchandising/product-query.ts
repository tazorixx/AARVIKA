import type { Product, TaxonomyBase } from '@/lib/catalog/types';
import type { MerchandisingItem, MerchandisingItemType, MerchandisingPage } from './types';

const TAG_BACKED_TYPES = new Set<MerchandisingItemType>([
  'ageGroup',
  'giftType',
  'milestone',
  'personality',
  'brand',
]);

function normalizeTag(value: string) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function itemTagCandidates(item: MerchandisingItem) {
  const slug = normalizeTag(item.slug || item.name);
  const id = normalizeTag(item.id);
  const name = normalizeTag(item.name);
  const page = normalizeTag(item.page);
  const type = normalizeTag(item.type);
  return new Set([
    id,
    slug,
    name,
    slug ? normalizeTag(`${type}:${slug}`) : '',
    slug ? normalizeTag(`${page}:${type}:${slug}`) : '',
  ].filter(Boolean));
}

function matchesTagBackedItem(product: Product, item: MerchandisingItem) {
  if (!TAG_BACKED_TYPES.has(item.type)) return true;
  const candidates = itemTagCandidates(item);
  return (product.tagIds ?? []).some((tag) => candidates.has(normalizeTag(tag)));
}

export function productsForMerchandisingPage(
  page: MerchandisingPage,
  products: Product[],
  occasions: TaxonomyBase[],
  collections: TaxonomyBase[],
) {
  if (page === 'personalised') {
    return products.filter((product) => product.personalization?.enabled === true);
  }

  if (page === 'hampers') {
    const activeCollectionIds = new Set(collections.filter((item) => item.active !== false).map((item) => item.id));
    return products.filter((product) => product.collectionIds?.some((id) => activeCollectionIds.has(id)));
  }

  if (page === 'lifestyle') return products;

  const occasionId = occasions.find((item) => item.active !== false && item.slug.toLowerCase() === page)?.id;
  return occasionId ? products.filter((product) => product.occasionIds?.includes(occasionId)) : products;
}

export function productMatchesMerchandisingItem(product: Product, item: MerchandisingItem) {
  if (item.type === 'event' && item.relatedId && !product.occasionIds?.includes(item.relatedId)) return false;
  if (item.type === 'category' && item.relatedId && !product.categoryIds?.includes(item.relatedId)) return false;
  if ((item.type === 'recipient' || item.type === 'lovedOne') && item.relatedId && !product.recipientIds?.includes(item.relatedId)) return false;
  if ((item.type === 'collection' || item.type === 'featured' || item.type === 'curated') && item.relatedId && !product.collectionIds?.includes(item.relatedId)) return false;
  if (item.type === 'budget' && item.min !== undefined && product.price < item.min) return false;
  if (item.type === 'budget' && item.max !== undefined && product.price > item.max) return false;
  if (item.type === 'culture' && !product.cultureTagIds?.includes(item.id)) return false;
  if (item.type === 'state' && !product.stateTagIds?.includes(item.id)) return false;
  if (!matchesTagBackedItem(product, item)) return false;
  return true;
}
