import groups from './furniture-groups.json' with { type: 'json' };
import type { Category, Product, Sku } from '../contracts.ts';
export { groups as furnitureGroups };
export function addFurnitureFixtures(products: Product[], skus: Sku[], categories: Category[]) {
  const base = products.find(p => p.id === 'custom-console')!;
  const dimensions = [[210, 90, 85], [200, 160, 90], [160, 90, 75], [120, 60, 90], [60, 60, 90], [120, 65, 90], [100, 40, 180], [150, 70, 75], [90, 40, 75], [140, 70, 75], [120, 45, 100], [80, 80, 75], [200, 160, 90], [80, 70, 100], [100, 50, 75], [120, 60, 80], [180, 60, 200], [150, 75, 75]];
  groups.forEach((children, index) => children.forEach((name, child) => {
    const family = `furniture-${index + 1}`, categoryId = `${family}-${child + 1}`, id = `demo-${categoryId}`;
    if (!categories.some(c => c.id === categoryId)) categories.push({ id: categoryId, departmentId: 'furniture', parentId: family, level: 3, name, active: true });
    products.push({ ...base, id, title: `${name} · design concept`, description: 'Unpriced furniture inquiry concept. Dimensions are illustrative reference values; no vendor, certified load/safety, price or installation availability is implied.', categoryIds: ['furniture-root', family, categoryId], departmentIds: ['furniture'], collectionIds: ['thoughtful'], skuIds: [], productType: 'furniture', purchaseMode: 'inquiry', bundleEligible: false, personalizationSchemaId: undefined, material: ['Wood', 'Metal', 'Glass', 'Fabric'][child % 4], color: ['Natural', 'White', 'Walnut'][child % 3], specs: { Sector: index < 9 ? 'Home' : 'Commercial', Family: categories.find(c => c.id === family)!.name, Width: String(dimensions[index][0]), Depth: String(dimensions[index][1]), Height: String(dimensions[index][2]), Unit: 'cm', Material: ['Wood', 'Metal', 'Glass', 'Fabric'][child % 4], Finish: ['Natural', 'Matte', 'Walnut'][child % 3], Style: child % 2 ? 'Traditional' : 'Modern', Assembly: 'Vendor confirmation required', Delivery: 'PIN/serviceability not verified', Compliance: index === 15 || index === 16 || index === 5 ? 'Supplier safety/compliance review required' : 'Supplier measurements required' } });
  }));
  const chair = products.find(p => p.id === 'desk-chair')!;
  Object.assign(chair.specs, { Sector: 'Home', Width: '55', Depth: '58', Height: '85', Unit: 'cm', Finish: 'Natural', Style: 'Modern', Assembly: 'Unverified', Delivery: 'Unverified' });
}
