import type { SearchQuery } from './contracts.ts';
import type { CatalogueSnapshot, CategoryQuery } from './api-contracts.ts';
import { CatalogueError } from './api-contracts.ts';
import { matchesDiscovery } from './discovery.ts';
import { previewProductPrice } from './product-price.ts';

export function validateSearch(input: unknown): SearchQuery {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new CatalogueError('INVALID_QUERY', 'Search must be an object.');
  const q = input as Record<string, unknown>;
  const strings = ['text','departmentId','categoryId','recipient','color','material','occasion','interest','productType','collectionId','sort','cursor'];
  const numbers = ['minPrice','maxPrice','age','year','maxWidth','maxDepth','maxHeight','limit'];
  const booleans = ['personalizedOnly','bundleOnly','verifiedDeliveryOnly','inStockOnly','includeUnpriced'];
  for (const [key, value] of Object.entries(q)) {
    if (value === undefined) continue;
    if (strings.includes(key)) { if (typeof value !== 'string' || value.length > 200) throw new CatalogueError('INVALID_QUERY', `Invalid ${key}.`); }
    else if (numbers.includes(key)) { if (typeof value !== 'number' || !Number.isFinite(value) || Math.abs(value) > Number.MAX_SAFE_INTEGER) throw new CatalogueError('INVALID_QUERY', `Invalid ${key}.`); }
    else if (booleans.includes(key)) { if (typeof value !== 'boolean') throw new CatalogueError('INVALID_QUERY', `Invalid ${key}.`); }
    else if (key === 'attributes') {
      if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).length > 32 || Object.entries(value).some(([k,v]) => ['__proto__','constructor','prototype'].includes(k) || k.length > 80 || typeof v !== 'string' || v.length > 120)) throw new CatalogueError('INVALID_QUERY', 'Invalid specification filters.');
    } else throw new CatalogueError('INVALID_QUERY', `Unknown search field: ${key}.`);
  }
  if (q.limit !== undefined && (!Number.isInteger(q.limit) || Number(q.limit) < 1 || Number(q.limit) > 100)) throw new CatalogueError('INVALID_QUERY', 'Limit must be 1–100.');
  if (q.cursor !== undefined && (!/^\d{1,9}$/.test(String(q.cursor)))) throw new CatalogueError('INVALID_QUERY', 'Invalid pagination cursor.');
  if (q.sort !== undefined && !['relevance','price-asc','price-desc'].includes(String(q.sort))) throw new CatalogueError('INVALID_QUERY', 'Invalid sort.');
  if (q.departmentId !== undefined && !['wedding','birthday','personalized','anniversary','hampers','clothing','stationery','furniture'].includes(String(q.departmentId))) throw new CatalogueError('INVALID_QUERY', 'Unknown department.');
  return q as SearchQuery;
}
export function searchSnapshot(data: Pick<CatalogueSnapshot, 'products'|'skus'|'bundleTemplates'>, input: SearchQuery) {
  const q = validateSearch(input), { products, skus, bundleTemplates } = data;
  const text = q.text?.trim().toLowerCase() ?? '';
  let result = products.filter(p => matchesDiscovery(p,q,skus,bundleTemplates) && (!text || [p.title,p.description,p.productType,...Object.values(p.specs),...p.departmentIds,...p.cultureIds,...p.ceremonyIds].join(' ').toLowerCase().includes(text)) && (!q.departmentId || p.departmentIds.includes(q.departmentId)) && (!q.categoryId || p.categoryIds.includes(q.categoryId)) && (!q.color || p.color === q.color) && (!q.material || p.material === q.material) && (!q.occasion || p.occasionIds.includes(q.occasion)));
  const price = (p: typeof products[number]) => previewProductPrice(p,skus,bundleTemplates);
  if (q.sort === 'price-asc') result = [...result].sort((a,b) => price(a)-price(b));
  if (q.sort === 'price-desc') result = [...result].sort((a,b) => price(b)-price(a));
  const start = Number(q.cursor ?? 0), limit = q.limit ?? 100;
  return { products: result.slice(start,start+limit), total: result.length, nextCursor: start+limit < result.length ? String(start+limit) : undefined };
}
export function categoriesFrom(data: CatalogueSnapshot, q: CategoryQuery = {}) { return data.categories.filter(c => c.active && (!q.departmentId || c.departmentId === q.departmentId) && (q.parentId === undefined || c.parentId === q.parentId) && (q.level === undefined || c.level === q.level)); }
export function suggestionsFrom(data: CatalogueSnapshot, text: string) { return [...new Set([...data.products.map(p=>p.title),...data.categories.map(c=>c.name),...data.wedding.traditions.map(t=>t.name),...data.wedding.ceremonies.map(c=>c.name)])].filter(s=>s.toLowerCase().includes(text.toLowerCase())).slice(0,5); }
