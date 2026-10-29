import { readyImages } from './capture';
import { test, expect } from '@playwright/test';
test('Birthday combines recipient, interest and arbitrary age with real product navigation', async ({ page }) => {
  await page.goto('/department/birthday', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'More ways to find your gift', exact: true }).click();
  await page.getByRole('button', { name: 'Recipient', exact: true }).click();
  await page.getByRole('button', { name: 'Her', exact: true }).click();
  await page.getByRole('button', { name: 'Interest', exact: true }).click();
  await page.getByRole('button', { name: 'Coffee', exact: true }).click();
  await page.getByRole('button', { name: 'Birthday Milestones', exact: true }).click();
  await page.getByRole('textbox', { name: 'Any birthday age (0–120)', exact: true }).fill('47');
  await expect(page.getByRole('button', { name: 'View Your-name ceramic mug', exact: true }).last()).toBeVisible();
  await readyImages(page); await page.screenshot({ path: 'evidence/task-06-birthday-390.png' });
  await page.getByRole('button', { name: 'View Your-name ceramic mug', exact: true }).last().click();
  await expect(page.getByRole('textbox', { name: 'Name to print *', exact: true })).toBeVisible();
});
test('Personalized jewellery child opens engraving schema and persists values in cart', async ({ page }) => {
  await page.goto('/category/personalized-8', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Explore Necklaces & Pendants', exact: true }).click();
  await page.getByRole('button', { name: 'View Necklaces & Pendants · sample design', exact: true }).last().click();
  await page.getByRole('textbox', { name: 'Engraving text *', exact: true }).fill('Always together');
  await page.getByRole('button', { name: 'Add to demo cart', exact: true }).click();
  await page.getByRole('button', { name: 'View cart', exact: true }).last().click();
  await expect(page.getByText('engraving: Always together', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText('engraving: Always together', { exact: true })).toBeVisible();
  await readyImages(page); await page.screenshot({ path: 'evidence/task-06-engraving-cart-390.png' });
});
