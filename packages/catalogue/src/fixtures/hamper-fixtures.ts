import type { Category, Product, Sku } from '../contracts.ts';
export function addHamperFixtures(products: Product[], skus: Sku[], categories: Category[]) {
  const parent = products.find(p => p.id === 'return-pouch')!;
  for (const [id, title, type] of [['bath-cloth', 'Cotton bath cloth', 'accessory'], ['baby-keepsake', 'Baby memory keepsake', 'gift']] as const) {
    products.push({ ...parent, id, title, description: 'Durable demo component. Verify actual supplier suitability before purchase.', skuIds: [`${id}-standard`], categoryIds: ['hampers-root'], departmentIds: ['hampers'], productType: type, personalizationSchemaId: undefined, specs: { Material: 'Cotton / keepsake materials', Safety: 'Sample concept; no child-safety certification. Keepsake is for adult use.' } });
    skus.push({ id: `${id}-standard`, productId: id, label: 'Standard', attributes: {}, price: { amount: 24900, currency: 'INR' }, inventory: { skuId: `${id}-standard`, available: 20, version: 1, demo: true } });
  }
  const contents = [['birthday-card', 'pen-set'], ['ceremony-lamp', 'ribbon-set'], ['ceremony-tray', 'return-pouch'], ['couple-frame', 'gift-box'], ['linen-journal', 'pen-set'], ['linen-journal', 'pen-set'], ['bath-cloth', 'travel-pouch'], ['ceremony-lamp', 'gift-box'], ['baby-keepsake', 'birthday-card']];
  for (let i = 1; i <= 9; i++) {
    const family = categories.find(c => c.id === `hampers-${i}`)!;
    const id = `hamper-${i}`;
    products.push({ ...parent, id, title: `${family.name} · demo set`, description: 'A prebuilt durable-goods demo set. Component stock and prices are shared with individual products. Customize the contents before adding.', categoryIds: ['hampers-root', family.id, ...categories.filter(c => c.parentId === family.id).map(c => c.id)], departmentIds: i === 1 ? ['hampers', 'birthday'] : i === 4 ? ['hampers', 'anniversary'] : ['hampers'], productType: 'hamper', skuIds: [], personalizationSchemaId: undefined, bundleEligible: false, glyph: '▧', specs: { Contents: '2 canonical product components', Fulfilment: 'Demo only; delivery and returns require supplier confirmation' }, prebuiltBundle: { templateId: 'gift-box', packaging: 'Lavender box', message: '', components: contents[i - 1].map(productId => ({ skuId: `${productId}-standard`, quantity: 1, personalization: (products.find(p => p.id === productId)?.personalizationSchemaId ? { name: 'Together', font: 'Classic' } : {}) as Record<string, string>, media: [] })) } });
  }
  for (const p of products.filter(p => p.departmentIds.includes('anniversary'))) p.discovery = { ...p.discovery, yearMin: 1, yearMax: 150 };
}
