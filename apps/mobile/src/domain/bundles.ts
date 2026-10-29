import type { BundleTemplate, CustomBundle, Product, Sku, PersonalizationSchema, Money } from './contracts';
import { validatePersonalization } from './personalization.ts';
export function previewBundle(bundle: Omit<CustomBundle, 'previewTotal'>, templates: BundleTemplate[], products: Product[], skus: Sku[], schemas: PersonalizationSchema[]): Money {
  const template = templates.find(t => t.id === bundle.templateId); if (!template) throw new Error('Gift box template unavailable.');
  if (!['Lavender box', 'Mint wrap'].includes(bundle.packaging)) throw new Error('Choose supported packaging.');
  if ([...bundle.message].length > 160) throw new Error('Gift message is limited to 160 characters.');
  let count = 0, units = 0, total = template.packagingFee; const aggregate: Record<string, number> = {};
  for (const c of bundle.components) {
    const sku = skus.find(s => s.id === c.skuId), product = products.find(p => p.id === sku?.productId);
    if (!sku || !product || !product.bundleEligible || product.purchaseMode !== 'buy' || !template.allowedProductTypes.includes(product.productType)) throw new Error('An item is incompatible with this gift box.');
    if (!Number.isInteger(c.quantity) || c.quantity < 1) throw new Error('Component quantities must be positive whole numbers.');
    aggregate[sku.id] = (aggregate[sku.id] ?? 0) + c.quantity;
    if (aggregate[sku.id] > sku.inventory.available) throw new Error(`${product.title} exceeds available demo stock.`);
    const schema = schemas.find(s => s.id === product.personalizationSchemaId); if (schema) { const errors = validatePersonalization(schema, c.personalization, c.media); if (errors.length) throw new Error(`${product.title}: ${errors[0]}`); } else if (Object.keys(c.personalization).length || c.media.length) throw new Error('This item does not support personalization.');
    count += c.quantity; units += c.quantity * product.bundleUnits; total += c.quantity * sku.price.amount;
  }
  if (count < template.minItems || count > template.maxItems) throw new Error(`Choose between ${template.minItems} and ${template.maxItems} items.`);
  if (units > template.capacity) throw new Error('These items exceed the box capacity. Remove an item or reduce quantity.');
  if (bundle.budgetLimit !== undefined && (!Number.isFinite(bundle.budgetLimit) || bundle.budgetLimit < 0 || total > bundle.budgetLimit)) throw new Error('This selection exceeds your budget including packaging.');
  for (const required of template.requiredProductTypes ?? []) if (!bundle.components.some(c => products.find(p => p.skuIds.includes(c.skuId))?.productType === required)) throw new Error(`This kit needs a ${required} item. You can choose an alternative.`);
  return { amount: total, currency: 'INR' };
}
