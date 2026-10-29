import type {Category, Product, Sku} from './contracts.ts';

/** Deterministic catalogue similarity. It uses published metadata, never sales claims. */
export function rankRelatedProducts(seed: Product, candidates: Product[], categories: Category[], skus: Sku[], limit = 8): Product[] {
  const levels = new Map(categories.map(category => [category.id, category.level]));
  const skuPrices = new Map<string, number>();
  const inStock = new Set<string>();
  for (const sku of skus) {
    const price = skuPrices.get(sku.productId);
    if (price === undefined || sku.price.amount < price) skuPrices.set(sku.productId, sku.price.amount);
    if (sku.inventory.available > 0) inStock.add(sku.productId);
  }
  const shared = (left: string[], right: string[]) => left.filter(value => right.includes(value)).length;
  const seedPrice = skuPrices.get(seed.id);
  const score = (candidate: Product) => {
    const category = Math.min(100, seed.categoryIds.reduce((total, id) => total + (candidate.categoryIds.includes(id) ? levels.get(id) === 3 ? 24 : levels.get(id) === 2 ? 4 : 1 : 0), 0));
    const attributes = ['Clothing type', 'Audience', 'Format'].reduce((total, key) => total + (seed.specs[key] && seed.specs[key] === candidate.specs[key] ? key === 'Clothing type' ? 10 : 4 : 0), 0);
    const candidatePrice = skuPrices.get(candidate.id);
    const price = seedPrice !== undefined && candidatePrice !== undefined ? Math.max(0, 6 - Math.floor(Math.abs(seedPrice - candidatePrice) / Math.max(seedPrice, 1) * 6)) : 0;
    return category + attributes + shared(seed.departmentIds, candidate.departmentIds) * 5 + (seed.productType === candidate.productType ? 10 : 0)
      + shared(seed.occasionIds, candidate.occasionIds) * 3 + shared(seed.recipientIds, candidate.recipientIds) * 2
      + (seed.style && seed.style === candidate.style ? 2 : 0) + (seed.material && seed.material === candidate.material ? 2 : 0)
      + (seed.purchaseMode === candidate.purchaseMode ? 2 : 0) + price;
  };
  const available = (product: Product) => product.purchaseMode === 'inquiry' || product.prebuiltBundle !== undefined || inStock.has(product.id);
  return candidates.filter(candidate => candidate.id !== seed.id).map(candidate => ({candidate, relevance: score(candidate)}))
    .sort((a, b) => b.relevance - a.relevance || Number(available(b.candidate)) - Number(available(a.candidate)) || a.candidate.id.localeCompare(b.candidate.id))
    .slice(0, Math.max(0, limit)).map(entry => entry.candidate);
}
