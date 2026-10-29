import { readyImages } from './capture';
import { test, expect } from '@playwright/test';
test('search filters, SKU details, back state, empty and missing product', async ({ page }) => {
  await page.goto('/search', { waitUntil: 'domcontentloaded' });
  await page.getByRole('textbox', { name: 'Search catalogue', exact: true }).fill('kurta');
  await expect(page.getByRole('button', { name: 'View Everyday cotton kurta', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'View Everyday cotton kurta', exact: true }).click();
  await page.getByRole('button', { name: 'Large · Cream', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Large · Cream', exact: true }).getByText('₹1,399')).toBeVisible();
  await page.getByRole('button', { name: '‹ Back', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Search catalogue', exact: true })).toHaveValue('kurta');
  await page.getByRole('button', { name: 'Refine your finds', exact: true }).click();
  await page.getByRole('textbox', { name: 'Maximum budget (₹)', exact: true }).fill('100');
  await page.getByRole('button', { name: 'Show results', exact: true }).click();
  await expect(page.getByText('No matching gifts', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Refine your finds', exact: true }).click();
  await page.getByRole('button', { name: 'Clear filters', exact: true }).click();
  await page.getByRole('button', { name: 'Show results', exact: true }).click();
  await expect(page.getByRole('button', { name: 'View Your-name ceramic mug', exact: true })).toBeVisible();
  await page.goto('/product/missing', { waitUntil: 'domcontentloaded' });
  await expect(page.getByText('Product unavailable', { exact: true })).toBeVisible();
  for (const width of [320, 390]) { await page.setViewportSize({ width, height: 844 }); await page.goto('/', { waitUntil: 'domcontentloaded' }); await expect(page.getByText('Thoughtfully picked', { exact: true })).toBeVisible(); await readyImages(page); await page.screenshot({ path: `evidence/task-02-home-${width}.png`, fullPage: true }); expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true); }
});
