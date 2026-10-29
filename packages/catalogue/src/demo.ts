import { addFurnitureFixtures } from './fixtures/furniture-fixtures.ts';
import { addClothingStationery } from './fixtures/clothing-stationery-fixtures.ts';
import { addHamperFixtures } from './fixtures/hamper-fixtures.ts';
import { searchSnapshot } from './reader.ts';
import { addPersonalizedFixtures } from './fixtures/personalized-fixtures.ts';
import type { SearchQuery, Product, Sku, Category, PersonalizationSchema, BundleTemplate } from './contracts.ts';
import weddingData from './fixtures/wedding-data.json' with { type: 'json' };
import taxonomy from './fixtures/taxonomy.json' with { type: 'json' };
export const categories = taxonomy as Category[];
export const schemas: PersonalizationSchema[] = [{ id: 'name-photo', fields: [{ key: 'name', label: 'Name to print', kind: 'text', required: true, maxLength: 24 }, { key: 'font', label: 'Lettering', kind: 'choice', required: true, choices: ['Classic', 'Modern'] }, { key: 'photo', label: 'Your photo', kind: 'photo', required: false }], preview: 'template', photoMaxBytes: 5 * 1024 * 1024, photoMimeTypes: ['image/jpeg', 'image/png', 'image/webp'] }];
type Seed = [string, string, Product['departmentIds'], string, string, string, number, string, string];
const seeds: Seed[] = [
  ['ceremony-tray', 'Keepsake ceremony tray', ['wedding', 'hampers'], 'tray', '✧', 'peach', 64900, 'Brass', 'Gold'],
  ['gift-box', 'Lavender keepsake box', ['hampers', 'birthday', 'anniversary'], 'box', '▧', 'lavender', 39900, 'Board', 'Purple'],
  ['name-mug', 'Your-name ceramic mug', ['personalized', 'birthday', 'anniversary'], 'drinkware', '☕', 'cream', 44900, 'Ceramic', 'Cream'],
  ['linen-journal', 'Linen daily journal', ['stationery', 'personalized', 'birthday'], 'notebook', '▤', 'mint', 34900, 'Paper', 'Green'],
  ['couple-frame', 'Together photo frame', ['anniversary', 'personalized', 'wedding'], 'photo', '▣', 'pink', 79900, 'Wood', 'Natural'],
  ['cotton-kurta', 'Everyday cotton kurta', ['clothing', 'wedding'], 'fashion', '♧', 'cream', 129900, 'Cotton', 'Cream'],
  ['desk-chair', 'Curved study chair', ['furniture'], 'furniture', '⌂', 'peach', 649900, 'Wood', 'Natural'],
  ['pen-set', 'The everyday pen pair', ['stationery', 'hampers'], 'pen', '✎', 'lavender', 24900, 'Metal', 'Purple'],
  ['return-pouch', 'Cotton return-gift pouch', ['wedding', 'hampers'], 'gift', '♢', 'pink', 14900, 'Cotton', 'Pink'],
  ['ceremony-lamp', 'Brass celebration lamp', ['wedding', 'anniversary'], 'essential', '♧', 'cream', 89900, 'Brass', 'Gold'],
  ['fabric-garland', 'Reusable fabric garland', ['wedding'], 'decor', '❀', 'mint', 59900, 'Cotton', 'Green'],
  ['bead-bracelet', 'Simple bead bracelet', ['wedding', 'birthday'], 'jewellery', '◌', 'pink', 29900, 'Glass', 'Pink'],
  ['birthday-card', 'A wish for you card', ['birthday', 'stationery', 'hampers'], 'card', '✉', 'peach', 9900, 'Paper', 'Peach'],
  ['travel-pouch', 'Monogram travel pouch', ['personalized', 'hampers'], 'accessory', '▱', 'mint', 54900, 'Cotton', 'Green'],
  ['custom-console', 'Made-for-you console', ['furniture'], 'furniture', '⌂', 'lavender', 0, 'Wood', 'Natural'],
  ['ribbon-set', 'Satin wrapping ribbons', ['stationery', 'hampers', 'wedding'], 'packaging', '∞', 'pink', 12900, 'Satin', 'Pink'],
];
export const products: Product[] = seeds.map<Product>(([id, title, departmentIds, productType, glyph, art, price, material, color]) => ({ id, title, departmentIds, productType, glyph, art, material, color, categoryIds: categories.filter(c => c.level === 1 && departmentIds.includes(c.departmentId)).map(c => c.id), collectionIds: ['thoughtful'], occasionIds: departmentIds.filter(x => ['birthday', 'anniversary', 'wedding'].includes(x)), recipientIds: ['Friend', 'Couple', 'Family'], cultureIds: [], ceremonyIds: [], description: `${title}, a sample design for exploring AARVIKA. This demonstration is not a merchant listing.`, style: 'Contemporary', specs: (productType === 'notebook' ? { Size: 'A5', Paper: '100 GSM', Sheets: '80', Ruling: 'Dotted' } : productType === 'fashion' ? { Fabric: 'Cotton', Fit: 'Regular', Care: 'Gentle wash' } : { Material: material, Colour: color }) as Record<string, string>, skuIds: price === 0 ? [] : [`${id}-standard`, ...(id === 'cotton-kurta' ? ['cotton-kurta-large'] : [])], personalizationSchemaId: ['name-mug', 'couple-frame', 'travel-pouch', 'linen-journal'].includes(id) ? 'name-photo' : undefined, bundleEligible: !['furniture', 'fashion'].includes(productType), bundleUnits: productType === 'tray' ? 3 : 1, purchaseMode: price === 0 ? 'inquiry' : 'buy', demo: true }));
export const skus: Sku[] = seeds.flatMap<Sku>(([id, , , , , , price]) => price === 0 ? [] : [{ id: `${id}-standard`, productId: id, label: id === 'cotton-kurta' ? 'Medium · Cream' : 'Standard', attributes: (id === 'cotton-kurta' ? { size: 'M' } : {}) as Record<string, string>, price: { amount: price, currency: 'INR' as const }, inventory: { skuId: `${id}-standard`, available: id === 'bead-bracelet' ? 0 : 25, version: 1, demo: true } }, ...(id === 'cotton-kurta' ? [{ id: 'cotton-kurta-large', productId: id, label: 'Large · Cream', attributes: { size: 'L' }, price: { amount: price + 10000, currency: 'INR' as const }, inventory: { skuId: 'cotton-kurta-large', available: 4, version: 1, demo: true } }] : [])]);
export const bundleTemplates: BundleTemplate[] = [{ id: 'gift-box', title: 'Your thoughtful gift box', minItems: 2, maxItems: 8, capacity: 10, packagingFee: 9900, allowedProductTypes: ['tray', 'box', 'drinkware', 'notebook', 'photo', 'pen', 'gift', 'essential', 'decor', 'jewellery', 'card', 'accessory', 'packaging', 'home', 'wearable', 'art', 'stationery'] }];
for (const product of products.filter(p => p.departmentIds.includes('wedding'))) { product.cultureIds = weddingData.traditions.map(t => t.name); product.ceremonyIds = weddingData.ceremonies.map(c => c.name); }
const fixturePlacements: Record<string, string[]> = { 'name-mug': ['Mugs'], 'linen-journal': ['Journals'], 'couple-frame': ['Photo Frames'], 'pen-set': ['Ball Pens'], 'travel-pouch': ['Bags & Pouches'], 'ribbon-set': ['Ribbons & Bows'], 'birthday-card': ['Greeting Cards'], 'cotton-kurta': ['Men', 'Fashion'], 'ceremony-tray': ['Ceremony Essentials', 'Wedding Hampers'], 'ceremony-lamp': ['Ceremony Essentials'], 'return-pouch': ['Gifts & Return Gifts', 'Wedding Return Gifts'], 'fabric-garland': ['Decorations'], 'bead-bracelet': ['Jewellery'], 'desk-chair': ['Study & Home Office'], 'custom-console': ['Special & Space-Saving'], 'gift-box': ['Custom Hampers', 'Build Your Own Hamper'] };
for (const product of products) for (const category of categories.filter(c => product.departmentIds.includes(c.departmentId) && fixturePlacements[product.id]?.includes(c.name))) { let current: Category | undefined = category; while (current) { if (!product.categoryIds.includes(current.id)) product.categoryIds.push(current.id); current = categories.find(c => c.id === current?.parentId); } }
addPersonalizedFixtures(products, skus, categories, schemas);
addHamperFixtures(products, skus, categories);
addClothingStationery(products, skus, categories);
addFurnitureFixtures(products, skus, categories);
export {defaultHomeLayout as pageLayout} from './home-layout.ts';
export function searchCatalog(query: SearchQuery) { return searchSnapshot({ products, skus, bundleTemplates },query); }
