import { readyImages } from './capture';
import { test, expect } from '@playwright/test';
test('Anniversary milestones and arbitrary year open a personalized couple product', async ({ page }) => {
  await page.goto('/department/anniversary', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'More ways to find your gift', exact: true }).click();
  await page.getByRole('button', { name: 'Anniversary Milestone', exact: true }).click();
  await page.getByRole('button', { name: '25 years · Silver', exact: true }).click();
  await page.getByRole('textbox', { name: 'Any anniversary year (1–150)', exact: true }).fill('37');
  await page.getByRole('button', { name: 'View Together photo frame', exact: true }).last().click();
  await expect(page.getByRole('textbox', { name: 'Name to print *', exact: true })).toBeVisible();
});
test('Hamper child -> prebuilt set -> budget/recipient/occasion -> persisted component cart', async ({ page }) => {
  await page.goto('/category/hampers-1-1', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'View Birthday Hampers · demo set', exact: true }).last().click();
  await page.getByRole('button', { name: 'Customize this hamper', exact: true }).click();
  await page.getByRole('textbox', { name: 'Hamper recipient', exact: true }).fill('Riya');
  await page.getByRole('textbox', { name: 'Hamper occasion', exact: true }).fill('Birthday');
  await page.getByRole('textbox', { name: 'Hamper budget including packaging (₹)', exact: true }).fill('1');
  await expect(page.getByText('This selection exceeds your budget including packaging.', { exact: true })).toBeVisible();
  await page.getByRole('textbox', { name: 'Hamper budget including packaging (₹)', exact: true }).fill('1000');
  await page.getByRole('button', { name: '3. Finish', exact: true }).click();
  await page.getByRole('button', { name: 'Add gift box to demo cart', exact: true }).click();
  await page.getByRole('button', { name: 'View gift box in cart', exact: true }).last().click();
  await expect(page.getByText('A wish for you card × 1', { exact: true })).toBeVisible();
  await expect(page.getByText('Packaging: Lavender box · For Riya · Birthday', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText('Packaging: Lavender box · For Riya · Birthday', { exact: true })).toBeVisible();
  await readyImages(page); await page.screenshot({ path: 'evidence/task-07-hamper-cart-390.png' });
});
