import { readyImages } from './capture';
import { test, expect } from '@playwright/test';
test('shared tabs and all eight department destinations at small widths', async ({ page }) => {
  test.setTimeout(180000);
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.getByText('DEMO CATALOGUE · No live stock or payments')).toHaveCount(0);
  for (const width of [320, 390, 768]) {
    await page.setViewportSize({ width, height: 844 });
    await expect(page.getByRole('button', { name: 'Search gifts', exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await readyImages(page); await page.screenshot({ path: `evidence/task-01-home-${width}.png`, fullPage: true });
  }
  for (const id of ['wedding', 'birthday', 'personalized', 'anniversary', 'hampers', 'clothing', 'stationery', 'furniture']) {
    await page.goto(`/department/${id}`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('button', { name: '‹ Back', exact: true })).toBeVisible();
  }
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Search gifts', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Search catalogue', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Cart', exact: true }).click();
  await expect(page.getByText('Your cart is empty')).toBeVisible();
  expect(errors).toEqual([]);
});
