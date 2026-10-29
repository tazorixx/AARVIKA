import { test, expect } from '@playwright/test';

test('account shortcuts open the existing shopping areas on a narrow phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto('/account');
  await expect(page.getByRole('heading', { name: 'My account' })).toBeVisible();
  await expect(page.getByText('LOCAL DEMO', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Wishlist', exact: true }).click();
  await expect(page).toHaveURL(/\/wishlist/);
  await page.goto('/account');
  await page.getByRole('button', { name: 'Shopping cart', exact: true }).click();
  await expect(page).toHaveURL(/\/cart/);
  await page.goto('/account');
  await page.getByRole('button', { name: 'Addresses', exact: true }).click();
  await expect(page).toHaveURL(/\/location/);
  await page.goto('/account');
  await page.getByRole('button', { name: 'My furniture inquiries', exact: true }).click();
  await expect(page).toHaveURL(/\/furniture\/requests/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
