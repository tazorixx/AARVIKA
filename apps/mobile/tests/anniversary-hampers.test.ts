import test from 'node:test';
import assert from 'node:assert/strict';
import { products, skus, schemas, categories, bundleTemplates, searchCatalog } from '../src/services/catalog.ts';
import { previewBundle } from '../src/domain/bundles.ts';
import { previewProductPrice } from '../src/domain/product-price.ts';
test('Anniversary supports arbitrary years combined with recipient and budget', () => { assert.ok(searchCatalog({ departmentId: 'anniversary', year: 37, recipient: 'Wife', maxPrice: 100000 }).total); assert.equal(searchCatalog({ year: 0 }).total, 0); });
test('every noncustom Hamper child maps to component-backed set without synthetic stock', () => { for (const c of categories.filter(c => c.departmentId === 'hampers' && c.level === 3 && c.parentId !== 'hampers-10')) assert.ok(products.some(p => p.prebuiltBundle && p.categoryIds.includes(c.id)), c.name); for (const p of products.filter(p => p.prebuiltBundle)) { assert.equal(p.skuIds.length, 0); assert.equal(previewProductPrice(p, skus, bundleTemplates), previewBundle(p.prebuiltBundle!, bundleTemplates, products, skus, schemas).amount); } });
test('hamper budget includes packaging, and price filtering handles component sets', () => { const set = products.find(p => p.id === 'hamper-1')!; assert.throws(() => previewBundle({ ...set.prebuiltBundle!, budgetLimit: 100 }, bundleTemplates, products, skus, schemas)); assert.ok(searchCatalog({ departmentId: 'hampers', bundleOnly: true, maxPrice: 45000 }).products.some(p => p.id === 'hamper-1')); });
