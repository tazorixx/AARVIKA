import { readyImages } from './capture';
import { test, expect } from '@playwright/test';
test('slow/error recovery, sold-out SKU, keyboard search and reduced-motion viewport', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto('/account', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'App settings', exact: true }).click();
  await page.getByRole('button', { name: 'Demo connection controls', exact: true }).click();
  await page.getByRole('button', { name: 'Network: slow', exact: true }).click();
  await page.getByRole('tab', { name: 'Home', exact: true }).click();
  await page.getByRole('button', { name: 'Search gifts', exact: true }).click();
  await expect(page.getByText('Finding thoughtful things', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'View Your-name ceramic mug', exact: true })).toBeVisible();
  await page.getByRole('button', { name: '‹ Back', exact: true }).click();
  await page.getByRole('tab', { name: 'Account', exact: true }).click();
  if (!await page.getByRole('button', { name: 'Network: failure', exact: true }).isVisible()) {
    if (!await page.getByRole('button', { name: 'Demo connection controls', exact: true }).isVisible()) await page.getByRole('button', { name: 'App settings', exact: true }).click();
    await page.getByRole('button', { name: 'Demo connection controls', exact: true }).click();
  }
  await page.getByRole('button', { name: 'Network: failure', exact: true }).click();
  await page.getByRole('tab', { name: 'Home', exact: true }).click();
  await page.getByRole('button', { name: 'Search gifts', exact: true }).click();
  await page.getByRole('textbox', { name: 'Search catalogue', exact: true }).fill('mug');
  await expect(page.getByText('Could not load products', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Try again', exact: true }).click();
  await expect(page.getByRole('button', { name: 'View Your-name ceramic mug', exact: true })).toBeVisible();
  await page.getByRole('textbox', { name: 'Search catalogue', exact: true }).fill('');
  await page.getByRole('textbox', { name: 'Search catalogue', exact: true }).focus();
  await page.keyboard.type('mug');
  await expect(page.getByRole('button', { name: 'View Your-name ceramic mug', exact: true })).toBeVisible();
  await page.goto('/product/bead-bracelet', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('button', { name: 'Sold out', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Sold out', exact: true }).scrollIntoViewIfNeeded();
  const bounds = await page.getByRole('button', { name: 'Sold out', exact: true }).boundingBox();
  expect(bounds!.height).toBeGreaterThanOrEqual(44);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await readyImages(page); await page.screenshot({ path: 'evidence/task-05-sold-out-reduced-motion-320.png', fullPage: true });
});
