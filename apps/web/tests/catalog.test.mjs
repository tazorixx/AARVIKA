import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { departments, findProducts, productPrice, productSku, safeImage, cartSubtotal } from '../catalog.mjs';

const snapshot = JSON.parse(readFileSync(new URL('../data/demo-catalogue.json', import.meta.url)));

test('web preview uses all approved departments and shared taxonomy', () => {
  assert.equal(departments.length, 8);
  assert.equal(snapshot.categories.length, 535);
  for (const department of departments) {
    assert.ok(snapshot.categories.some(category => category.departmentId === department.id && category.level === 1));
    assert.ok(findProducts(snapshot, { department: department.id }).length > 0, department.id);
  }
});
test('category filters use product placements, including child categories', () => {
  const product = snapshot.products.find(item => item.categoryIds.some(id => snapshot.categories.find(category => category.id === id && category.level === 3)));
  assert.ok(product);
  const child = product.categoryIds.find(id => snapshot.categories.find(category => category.id === id && category.level === 3));
  assert.ok(findProducts(snapshot, { category: child }).some(item => item.id === product.id));
});
test('prices and bag totals come from canonical SKU amounts', () => {
  const product = snapshot.products.find(item => item.skuIds.length > 0);
  const sku = productSku(snapshot, product);
  assert.ok(sku);
  assert.equal(productPrice(snapshot, product), Math.min(...snapshot.skus.filter(item => product.skuIds.includes(item.id)).map(item => item.price.amount)));
  assert.equal(cartSubtotal(snapshot, [{ skuId: sku.id, quantity: 2 }]), sku.price.amount * 2);
});
test('demo media is local and unknown media falls back to clearly illustrated art', () => {
  const product = snapshot.products[0];
  assert.match(safeImage(product, 'fixture'), /^\/assets\/demo-art\//);
  assert.match(safeImage({ ...product, media: [{ path: '/demo-uploads/example.png' }] }, 'admin'), /^http:\/\/127\.0\.0\.1:3100\/demo-uploads\//);
  assert.match(safeImage({ ...product, media: [{ path: 'https://unsafe.example/image.jpg' }] }, 'admin'), /^\/assets\/demo-art\//);
});
