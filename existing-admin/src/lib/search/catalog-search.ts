import type { Product, TaxonomyBase } from '@/lib/catalog/types';

export type SearchTaxonomies = {
  categories: TaxonomyBase[];
  occasions: TaxonomyBase[];
  recipients: TaxonomyBase[];
  collections: TaxonomyBase[];
};

export type SearchTaxonomyMatches = {
  categoryIds: Set<string>;
  occasionIds: Set<string>;
  recipientIds: Set<string>;
  collectionIds: Set<string>;
};

export function normalizeSearchKey(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, ' ').slice(0, 120);
}

export function normalizeSearchText(value: string) {
  return normalizeSearchKey(value)
    .replace(/[-_:/.]+/g, ' ')
    .replace(/[^a-z0-9\s]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function expandSearchTerms(query: string, synonyms: Record<string, string[]>) {
  const key = normalizeSearchKey(query);
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of [key, ...(synonyms[key] || [])]) {
    const normalized = normalizeSearchText(value);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(normalized);
  }
  return result;
}

function textMatchScore(value: string | undefined, terms: string[], weights: [number, number, number]) {
  const text = normalizeSearchText(value || '');
  if (!text) return 0;
  let score = 0;
  for (const term of terms) {
    if (text === term) score = Math.max(score, weights[0]);
    else if (text.startsWith(term)) score = Math.max(score, weights[1]);
    else if (text.includes(term)) score = Math.max(score, weights[2]);
  }
  return score;
}

function taxonomyMatches(items: TaxonomyBase[], terms: string[]) {
  const ids = new Set<string>();
  for (const item of items) {
    if (item.active === false) continue;
    const score = Math.max(
      textMatchScore(item.name, terms, [700, 560, 430]),
      textMatchScore(item.slug, terms, [680, 540, 420]),
      textMatchScore(item.description, terms, [300, 260, 220]),
    );
    if (score > 0) ids.add(item.id);
  }
  return ids;
}

export function buildSearchTaxonomyMatches(taxonomies: SearchTaxonomies, terms: string[]): SearchTaxonomyMatches {
  return {
    categoryIds: taxonomyMatches(taxonomies.categories, terms),
    occasionIds: taxonomyMatches(taxonomies.occasions, terms),
    recipientIds: taxonomyMatches(taxonomies.recipients, terms),
    collectionIds: taxonomyMatches(taxonomies.collections, terms),
  };
}

function intersects(values: string[] | undefined, ids: Set<string>) {
  return Boolean(values?.some((value) => ids.has(value)));
}

function listTextScore(values: string[] | undefined, terms: string[], weight: number) {
  if (!values?.length) return 0;
  for (const value of values) {
    const normalized = normalizeSearchText(value);
    if (terms.some((term) => normalized === term || normalized.includes(term))) return weight;
  }
  return 0;
}

export function scoreSearchProduct(product: Product, terms: string[], matches: SearchTaxonomyMatches) {
  let score = 0;

  score = Math.max(score, textMatchScore(product.title, terms, [1000, 700, 500]));
  score = Math.max(score, textMatchScore(product.slug, terms, [620, 460, 350]));
  score = Math.max(score, textMatchScore(product.shortDescription, terms, [340, 280, 220]));
  score = Math.max(score, textMatchScore(product.description, terms, [300, 250, 200]));

  for (const keyword of product.seo?.keywords || []) {
    score = Math.max(score, textMatchScore(keyword, terms, [420, 340, 280]));
  }

  if (intersects(product.occasionIds, matches.occasionIds)) score = Math.max(score, 560);
  if (intersects(product.recipientIds, matches.recipientIds)) score = Math.max(score, 540);
  if (intersects(product.categoryIds, matches.categoryIds)) score = Math.max(score, 520);
  if (intersects(product.collectionIds, matches.collectionIds)) score = Math.max(score, 500);

  score = Math.max(score, listTextScore(product.tagIds, terms, 410));
  score = Math.max(score, listTextScore(product.cultureTagIds, terms, 420));
  score = Math.max(score, listTextScore(product.stateTagIds, terms, 390));

  if (product.featured) score += 15;
  if (product.bestseller) score += 10;
  if (product.newArrival) score += 5;
  return score;
}
