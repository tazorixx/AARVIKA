import { previewProductPrice } from './product-price.ts';
import type { BundleTemplate, Product, SearchQuery, Sku } from './contracts.ts';
export function matchesDiscovery(p: Product, q: SearchQuery, skus: Sku[], templates: BundleTemplate[] = []): boolean {
  if (q.recipient && !p.recipientIds.includes(q.recipient)) return false;
  if (q.interest && !p.discovery?.interests?.includes(q.interest)) return false;
  if (q.age !== undefined && (!Number.isInteger(q.age) || q.age < 0 || q.age > 120 || q.age < (p.discovery?.ageMin ?? 0) || q.age > (p.discovery?.ageMax ?? 120))) return false;
  if (q.year !== undefined && (!Number.isInteger(q.year) || q.year < 1 || q.year > 150 || q.year < (p.discovery?.yearMin ?? 1) || q.year > (p.discovery?.yearMax ?? 150))) return false;
  if (q.productType && p.productType !== q.productType) return false;
  if (q.personalizedOnly && !p.personalizationSchemaId) return false;
  if (q.bundleOnly && !p.prebuiltBundle && p.productType !== 'box') return false;
  if (q.verifiedDeliveryOnly && !p.discovery?.deliveryVerified) return false;
  if (q.collectionId && !p.collectionIds.includes(q.collectionId)) return false;
  for (const [key, value] of [['Width', q.maxWidth], ['Depth', q.maxDepth], ['Height', q.maxHeight]] as const) if (value !== undefined && (!Number.isFinite(value) || value <= 0 || !p.specs[key] || Number(p.specs[key]) > value)) return false;
  const attributes = Object.entries(q.attributes ?? {}).filter(([, value]) => value !== '');
  if (p.prebuiltBundle) {
    const price = previewProductPrice(p, skus, templates);
    if ((q.minPrice !== undefined && price < q.minPrice) || (q.maxPrice !== undefined && price > q.maxPrice) || attributes.length) return false;
    if (q.inStockOnly && p.prebuiltBundle.components.some(c => (skus.find(s => s.id === c.skuId)?.inventory.available ?? 0) < c.quantity)) return false;
    return true;
  }
  if (p.purchaseMode === 'inquiry' && q.includeUnpriced) return !q.inStockOnly && attributes.every(([key, value]) => p.specs[key] === value);
  const hasSkuFilter = q.minPrice !== undefined || q.maxPrice !== undefined || q.inStockOnly || attributes.length;
  if (hasSkuFilter && !skus.some(s => s.productId === p.id && (q.minPrice === undefined || s.price.amount >= q.minPrice) && (q.maxPrice === undefined || s.price.amount <= q.maxPrice) && (!q.inStockOnly || s.inventory.available > 0) && attributes.every(([key, value]) => (s.attributes[key] ?? p.specs[key]) === value))) return false;
  return true;
}
