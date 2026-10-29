import { test, expect } from '@playwright/test';
test('fixture startup has no runtime errors or remote service requests', async ({ page }) => {
  const errors: string[] = [], external: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.route('**/*', route => { const u = new URL(route.request().url()); if (['localhost', '127.0.0.1', '::1'].includes(u.hostname) || ['data:', 'blob:'].includes(u.protocol)) return route.continue(); external.push(u.hostname); return route.abort(); });
  await page.goto('/account', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'App settings', exact: true }).click();
  await page.getByRole('button', { name: 'Demo connection controls', exact: true }).click();
  await expect(page.getByText(`Runtime: development · ${process.env.E2E_DATA_MODE ?? 'fixture'}`, { exact: true })).toBeVisible();
  await page.getByRole('tab', { name: 'Home', exact: true }).click();
  await page.getByRole('button', { name: 'Search gifts', exact: true }).click();
  await expect(page.getByRole('button', { name: 'View Your-name ceramic mug', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'View Your-name ceramic mug', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Name to print *', exact: true })).toBeVisible();
  expect(external).toEqual([]);
  expect(errors).toEqual([]);
});
