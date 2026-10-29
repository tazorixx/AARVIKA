/* Shared typed fixture snapshot for local preview when the isolated admin is stopped. */
const fs = require('node:fs');
const path = require('node:path');
require('../../../existing-admin/node_modules/tsx/dist/cjs/index.cjs');
const { demoSnapshot } = require('../../../packages/catalogue/src/fixture-adapter.ts');
const snapshot = demoSnapshot();
const art = {
  tray: 'tray', box: 'box', drinkware: 'mug', notebook: 'journal', photo: 'frame',
  fashion: 'shirt', furniture: 'chair', pen: 'pen', gift: 'pouch', essential: 'lamp',
  decor: 'lamp', jewellery: 'jewellery', card: 'card', accessory: 'pouch',
  packaging: 'box', wearable: 'shirt', stationery: 'journal', home: 'lamp',
};
snapshot.products = snapshot.products.map(product => ({
  ...product,
  media: product.media?.length ? product.media : [{
    path: `/assets/demo-art/${art[product.productType] || 'box'}.png`,
    alt: `${product.title} · demo illustration`,
  }],
}));
const target = path.join(__dirname, '..', 'data', 'demo-catalogue.json');
fs.writeFileSync(target, JSON.stringify(snapshot));
console.log(`Exported ${snapshot.products.length} demo designs and ${snapshot.categories.length} categories from shared catalogue contracts.`);
