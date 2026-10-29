import data from './fixtures/wedding-data.json' with { type: 'json' };
import type { WeddingTradition, Ceremony, CeremonyNeed, BundleTemplate } from './contracts.ts';
import { bundleTemplates, products } from './demo.ts';
export const traditions = data.traditions as WeddingTradition[];
export const ceremonies = data.ceremonies as (Ceremony & { reviewRule: string; source: string; sourceRange: string })[];
export const weddingLanes = [
  { title: 'Ceremony essentials', types: ['tray', 'essential'] }, { title: 'Fashion & outfits', types: ['fashion'] }, { title: 'Jewellery', types: ['jewellery'] }, { title: 'Decorations', types: ['decor'] }, { title: 'Gifts & return gifts', types: ['gift', 'photo', 'packaging'] },
];
// Demonstration merchandising links only. These are deliberately not ritual approvals.
export const ceremonyNeeds: CeremonyNeed[] = ceremonies.flatMap(c => ['gift', 'packaging', 'tray'].map(type => ({ id: `${c.id}:${type}`, ceremonyId: c.id, productType: type, eligibleSkuIds: products.filter(p => p.departmentIds.includes('wedding') && p.productType === type).flatMap(p => p.skuIds), familyApprovalRequired: true })));
export const weddingKit: BundleTemplate = { ...bundleTemplates[0], id: 'wedding-kit', title: 'Your family-selected function kit', minItems: 2, maxItems: 30, capacity: 40, allowedProductTypes: ['tray', 'gift', 'essential', 'decor', 'jewellery', 'packaging', 'photo'], requiredProductTypes: ['gift'] };
export const allBundleTemplates = [...bundleTemplates, weddingKit];
export function filterTraditions(faith: string, region: string, query: string, source = { traditions, ceremonies }) {
  const { traditions, ceremonies } = source;
  return traditions.filter(t => (!faith || t.faith === faith) && (!region || t.regions.join(' ').toLowerCase().includes(region.toLowerCase()) || t.regions.includes('Pan-India')) && (!query || `${t.name} ${t.faith} ${t.regions.join(' ')} ${ceremonies.filter(c => c.traditionId === t.id).map(c => c.name).join(' ')}`.toLowerCase().includes(query.toLowerCase())));
}
