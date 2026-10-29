import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path) => readFileSync(new URL(`../src/${path}`, import.meta.url), 'utf8');

test('M9-B authenticates token registration and keeps token ownership server-side', () => {
  const route = read('app/api/account/push-tokens/route.ts');
  const push = read('lib/notifications/push.ts');
  assert.match(route, /verifyBearerToken/);
  assert.match(route, /registerPushToken\(getAdminDb\(\), uid/);
  assert.match(push, /mobile_push_tokens/);
  assert.match(push, /sha256/);
  assert.match(push, /snap\.data\(\)\?\.userId !== userId/);
});

test('M9-B sends through Expo Push Service from the trusted backend only', () => {
  const push = read('lib/notifications/push.ts');
  assert.match(push, /https:\/\/exp\.host\/--\/api\/v2\/push\/send/);
  assert.match(push, /EXPO_PUSH_ACCESS_TOKEN/);
  assert.match(push, /GIFT4U_PUSH_APP_VARIANT/);
  assert.match(push, /DeviceNotRegistered/);
});

test('M9-B queues push independently from email and uses safe lock-screen copy', () => {
  const service = read('lib/notifications/service.ts');
  assert.match(service, /push:\s*\{\s*status:\s*"queued"/s);
  assert.match(service, /where\("push\.status",\s*"==",\s*"queued"\)/);
  assert.match(service, /Payment needs attention/);
  assert.match(service, /Gift4U Support replied/);
  assert.doesNotMatch(service, /trackingNumber.*pushCopy/s);
});

test('M9-B adds out-for-delivery and support reply events without making them fatal', () => {
  const shipment = read('app/api/admin/orders/[orderId]/shipment/route.ts');
  const support = read('app/api/admin/support/[ticketId]/route.ts');
  const templates = read('lib/notifications/templates.ts');
  assert.match(shipment, /order_out_for_delivery/);
  assert.match(support, /support_reply/);
  assert.match(support, /Non-fatal: failed to queue support reply notification/);
  assert.match(templates, /support_reply/);
  assert.match(templates, /order_out_for_delivery/);
});

test('M9-B test notification endpoint is development-only', () => {
  const route = read('app/api/account/push-tokens/test/route.ts');
  assert.match(route, /process\.env\.NODE_ENV === "production"/);
  assert.match(route, /verifyBearerToken/);
  assert.match(route, /sendExpoPushToUser/);
});
