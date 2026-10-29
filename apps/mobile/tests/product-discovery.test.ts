import {test} from 'node:test';
import assert from 'node:assert/strict';
import {demoSnapshot} from '../../../packages/catalogue/src/fixture-adapter.ts';
import {rankRelatedProducts} from '../../../packages/catalogue/src/recommendations.ts';
import {parseVisualMedia} from '../../../packages/catalogue/src/visual-commerce.ts';

test('related designs use published category and SKU facts without duplicating the product', () => {
  const data = demoSnapshot();
  const seed = data.products.find(product => product.id === 'name-mug')!;
  const shared = {...seed, id: 'shared-child', title: 'Shared child', skuIds: ['shared-child-sku']};
  const other = {...seed, id: 'other-type', title: 'Other type', productType: 'other', categoryIds: [], skuIds: ['other-type-sku']};
  const soldOut = {...shared, id: 'shared-sold-out', title: 'Shared but sold out', skuIds: ['shared-sold-out-sku']};
  const baseSku = data.skus.find(sku => sku.productId === seed.id)!;
  const variants = [shared, other, soldOut].map(product => ({...baseSku, id: product.skuIds[0], productId: product.id, inventory: {...baseSku.inventory, skuId: product.skuIds[0], available: product.id === 'shared-sold-out' ? 0 : 2}}));
  const ranked = rankRelatedProducts(seed, [seed, other, soldOut, shared], data.categories, [baseSku, ...variants]);
  assert.deepEqual(ranked.map(product => product.id), ['shared-child', 'shared-sold-out', 'other-type']);
  assert.equal(ranked.some(product => product.id === seed.id), false);
});

test('a garment ranks its matching clothing family before unrelated apparel', () => {
  const data = demoSnapshot();
  const seed = data.products.find(product => product.id === 'cotton-kurta')!;
  const ranked = rankRelatedProducts(seed, data.products, data.categories, data.skus, 8);
  assert.equal(ranked[0]?.title, 'Men Ethnic Wear · demo');
  assert.equal(ranked.some(product => product.id === seed.id), false);
});

test('category hero galleries accept bounded safe images and reject unsafe entries', () => {
  const gallery = {images: [{imagePath: '/demo-art/box.png', imageAlt: 'Front of gift box'}, {imagePath: '/demo-art/mug.png', imageAlt: 'Detail of gift box'}]};
  assert.deepEqual(parseVisualMedia(gallery).images, gallery.images);
  assert.throws(() => parseVisualMedia({images: [{imagePath: 'https://example.invalid/a.jpg', imageAlt: 'Unsafe'}]}));
  assert.throws(() => parseVisualMedia({images: [gallery.images[0], gallery.images[0]]}));
  assert.throws(() => parseVisualMedia({images: Array(6).fill(gallery.images[0])}));
});
