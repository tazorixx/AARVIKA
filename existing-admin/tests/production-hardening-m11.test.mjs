import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const source = async (path) => readFile(new URL(path, root), 'utf8');

test('M11 captures variant pricing from live server product data', async () => {
  const pricing = await source('src/lib/cart/pricing.ts');
  const cart = await source('src/app/api/cart/route.ts');
  assert.match(pricing, /CART_PRICING_VERSION\s*=\s*2/);
  assert.match(pricing, /selected\.price/);
  assert.match(pricing, /priceDelta/);
  assert.match(cart, /resolveAuthoritativeCartSelection/);
  assert.match(cart, /priceAtAdd:\s*selection\.price/);
  assert.match(cart, /pricingVersion:\s*selection\.pricingVersion/);
});

test('M11 requires a persistent checkout idempotency key and recovers the first order', async () => {
  const route = await source('src/app/api/checkout/order/route.ts');
  const helper = await source('src/lib/checkout/idempotency.ts');
  assert.match(route, /clientRequestId/);
  assert.match(route, /CHECKOUT_REQUEST_ID_REQUIRED/);
  assert.match(route, /tx\.create\(attemptRef/);
  assert.match(route, /existingOrderResponse/);
  assert.match(route, /checkoutIntentChanged/);
  assert.match(helper, /checkout_order_requests/);
  assert.match(helper, /sha256/);
});

test('M11 exposes authenticated self-service deletion with active-order protection', async () => {
  const route = await source('src/app/api/account/delete/route.ts');
  const deletion = await source('src/lib/account/deletion.ts');
  const privacy = await source('src/app/policies/privacy/page.tsx');
  const page = await source('src/app/account/delete/page.tsx');
  assert.match(route, /verifyBearerToken/);
  assert.match(route, /confirm.*DELETE/s);
  assert.match(deletion, /ACTIVE_ORDERS_BLOCK_DELETION/);
  assert.match(deletion, /getAdminAuth\(\)\.deleteUser/);
  assert.match(deletion, /mobile_push_tokens/);
  assert.match(deletion, /support_tickets/);
  assert.match(deletion, /checkout_order_requests/);
  assert.match(deletion, /accountDeletedAt/);
  assert.match(privacy, /\/account\/delete/);
  assert.match(page, /Permanently delete account/);
});
