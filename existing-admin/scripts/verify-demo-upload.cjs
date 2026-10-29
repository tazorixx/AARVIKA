/* eslint-disable @typescript-eslint/no-require-imports -- Local emulator HTTP verification. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { isolatedEnv } = require('./isolated-env.cjs');
Object.assign(process.env, isolatedEnv());
const { blankAuthoring } = require('../../packages/catalogue/src/admin-contracts.ts');
const base = 'http://127.0.0.1:3100';
const departments = ['wedding', 'birthday', 'personalized', 'anniversary', 'hampers', 'clothing', 'stationery', 'furniture'];

(async () => {
  const signed = await fetch('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=demo-aarvika-local-key', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'owner@aarvika.invalid', password: 'Local-demo-only-2026!', returnSecureToken: true }),
  });
  assert.equal(signed.status, 200);
  const { idToken } = await signed.json();
  async function api(path, method = 'GET', body, status = 200) {
    const response = await fetch(base + path, {
      method, headers: { Authorization: `Bearer ${idToken}`, 'Content-Type': 'application/json' },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const result = await response.json();
    assert.equal(response.status, status, `${method} ${path}: ${JSON.stringify(result)}`);
    return result;
  }

  const file = fs.readFileSync('public/demo-art/box.png');
  const form = new FormData();
  form.append('file', new Blob([file], { type: 'image/png' }), 'qa-box.png');
  const upload = await fetch(base + '/api/admin/uploads/demo-product', {
    method: 'POST', headers: { Authorization: `Bearer ${idToken}` }, body: form,
  });
  const media = await upload.json();
  assert.equal(upload.status, 201, JSON.stringify(media));
  assert.match(media.url, /^\/demo-uploads\/[a-f0-9-]+\.png$/);
  const served = await fetch(base + media.url);
  assert.equal(served.status, 200);
  assert.equal(served.headers.get('content-type'), 'image/png');
  assert.deepEqual(Buffer.from(await served.arrayBuffer()), file);
  const unauthorized = await fetch(base + '/api/admin/uploads/demo-product', { method: 'POST', body: form });
  assert.equal(unauthorized.status, 401);
  const bad = new FormData();
  bad.append('file', new Blob(['not an image'], { type: 'image/png' }), 'bad.png');
  const invalid = await fetch(base + '/api/admin/uploads/demo-product', { method: 'POST', headers: { Authorization: `Bearer ${idToken}` }, body: bad });
  assert.equal(invalid.status, 400);

  const categories = await api('/api/admin/categories');
  const stamp = Date.now();
  const sub = await api('/api/admin/categories', 'POST', {
    name: `Demo QA sub ${stamp}`, slug: `demo-qa-sub-${stamp}`, departmentId: 'stationery', parentId: 'stationery-root', active: true,
  }, 201);
  const child = await api('/api/admin/categories', 'POST', {
    name: `Demo QA child ${stamp}`, slug: `demo-qa-child-${stamp}`, departmentId: 'stationery', parentId: sub.id, active: true,
  }, 201);
  const updatedCategories = await api('/api/admin/categories');
  assert.equal(updatedCategories.find(c => c.id === sub.id)?.level, 2);
  assert.equal(updatedCategories.find(c => c.id === child.id)?.level, 3);

  const created = [];
  for (const department of departments) {
    const category = department === 'stationery'
      ? updatedCategories.find(c => c.id === child.id)
      : categories.find(c => c.departmentId === department && c.level === 3 && c.active !== false)
        ?? categories.find(c => c.departmentId === department && c.level === 2 && c.active !== false);
    assert.ok(category, `Missing active subcategory in ${department}`);
    const inquiry = department === 'furniture';
    const configuration = {
      ...blankAuthoring(), departmentIds: [department], canonicalCategoryId: category.id,
      productType: inquiry ? 'furniture' : 'gift', purchaseMode: inquiry ? 'inquiry' : 'buy',
      ...(inquiry ? { specs: { Sector: 'Home', Width: '80', Depth: '70', Height: '90', Unit: 'cm', Finish: 'Matte' } } : {}),
    };
    const product = await api('/api/admin/products', 'POST', {
      title: `Demo child placement ${department} ${stamp}`,
      sku: `QA-CHILD-${department.toUpperCase()}-${stamp}`, price: inquiry ? 0 : 199,
      status: 'live', categoryIds: [category.id], images: [{ url: media.url, alt: 'Local demo upload' }],
      inventory: { quantity: inquiry ? 0 : 3 }, aarvika: configuration,
    }, 201);
    const saved = await api(`/api/admin/products/${product.id}`);
    assert.ok(saved.categoryIds.includes(category.id));
    assert.ok(saved.categoryIds.includes(`${department}-root`));
    assert.equal(saved.images[0].url, media.url);
    created.push({ id: product.id, categoryId: category.id, department });
  }
  const projectionResponse = await fetch(base + '/api/mobile/v2/catalog');
  assert.equal(projectionResponse.status, 200);
  const projection = (await projectionResponse.json()).data;
  assert.equal(projection.meta.projectId, 'demo-aarvika-local');
  for (const { id, categoryId, department } of created) {
    const product = projection.products.find(p => p.id === id);
    assert.ok(product, `Mobile catalogue missing ${department}`);
    assert.ok(product.categoryIds.includes(categoryId));
    assert.equal(product.media[0].path, media.url);
  }
  assert.ok(projection.categories.some(c => c.id === child.id && c.parentId === sub.id));
  console.log(`Demo upload verified: valid/invalid/authenticated image handling, served bytes, new subcategory and child, live products with child placements and media in all ${departments.length} departments, and mobile readback. Emulator only.`);
})().catch(error => { console.error(error); process.exitCode = 1; });
