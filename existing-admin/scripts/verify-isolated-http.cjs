/* eslint-disable @typescript-eslint/no-require-imports -- Direct Node verification launcher. */
const assert = require('node:assert/strict');
const { isolatedEnv } = require('./isolated-env.cjs');
isolatedEnv();
const base = 'http://127.0.0.1:3100';
async function token(email) {
  const response = await fetch('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=demo-aarvika-local-key', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password: 'Local-demo-only-2026!', returnSecureToken: true }) });
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.equal(JSON.parse(Buffer.from(data.idToken.split('.')[1], 'base64url')).aud, 'demo-aarvika-local');
  return data.idToken;
}
(async () => {
  assert.equal((await fetch(base + '/api/admin/products')).status, 401);
  const support = await token('support@aarvika.invalid');
  assert.equal((await fetch(base + '/api/admin/products', { method: 'POST', headers: { Authorization: 'Bearer ' + support, 'Content-Type': 'application/json' }, body: '{}' })).status, 403);
  const owner = await token('owner@aarvika.invalid');
  const headers = { Authorization: 'Bearer ' + owner };
  const products = await fetch(base + '/api/admin/products', { headers });
  assert.equal(products.status, 200);
  assert.ok((await products.json()).some(p => p.id === 'local-demo-product'));
  assert.equal((await fetch(base + '/api/admin/uploads/imagekit', { headers })).status, 503);
  assert.equal((await fetch(base + '/api/checkout/order', { method: 'POST', headers })).status, 503);
  console.log('6 HTTP isolation checks passed: anonymous denial, demo token audience, support denial, owner demo reads, uploads disabled, order/payment placement disabled. No tokens printed.');
})().catch(error => { console.error(error.message); process.exitCode = 1; });
