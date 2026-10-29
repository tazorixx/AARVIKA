import type { BundleTemplate, Product, Sku } from './contracts.ts';
export function previewProductPrice(p: Product, skus: Sku[], templates: BundleTemplate[]): number {
  if (p.prebuiltBundle) { const template = templates.find(t => t.id === p.prebuiltBundle!.templateId); if (!template) return Infinity; return template.packagingFee + p.prebuiltBundle.components.reduce((n, c) => n + (skus.find(s => s.id === c.skuId)?.price.amount ?? Infinity) * c.quantity, 0); }
  return Math.min(...skus.filter(s => s.productId === p.id).map(s => s.price.amount));
}
