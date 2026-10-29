import { test, expect, type Page } from '@playwright/test';

async function tabsStayVisible(page: Page, active: string) {
  const tabs = page.getByRole('tab');
  await expect(tabs).toHaveCount(5);
  for (const label of ['Home', 'Categories', 'Offers', 'Wishlist', 'Account']) {
    await expect(page.getByRole('tab', { name: label, exact: true })).toBeInViewport();
  }
  await expect(page.getByRole('tab', { name: active, exact: true })).toHaveAttribute('aria-selected', 'true');
  const bar = await tabs.first().boundingBox();
  expect(bar).not.toBeNull();
  expect(bar!.y).toBeGreaterThan(700);
  await expect(page.getByRole('button', { name: /^Cart(?: \(\d+\))?$/ })).toBeVisible();
}

test('existing five tabs persist on Home, category and product listing without covering content', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/*', route => {
    const url = new URL(route.request().url());
    return ['127.0.0.1', 'localhost'].includes(url.hostname) || ['blob:', 'data:'].includes(url.protocol) ? route.continue() : route.abort();
  });
  await page.goto('/');
  await tabsStayVisible(page, 'Home');
  await page.getByRole('tab', { name: 'Categories', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Explore departments', exact: true })).toBeVisible();
  // Use the real category browser; preserve the existing public category URL.
  await page.getByRole('textbox', { name: 'Find a category', exact: true }).fill('Drinkware');
  await page.getByRole('button', { name: /Open .*Drinkware in personalized/i }).first().click();
  await expect(page).toHaveURL(/\/category\//);
  await tabsStayVisible(page, 'Categories');
  await page.getByRole('button', { name: 'Shop this category', exact: true }).click();
  await expect(page).toHaveURL(/\/search\?/);
  const listingUrl = page.url();
  await expect(page.getByRole('button', { name: /^View / }).first()).toBeVisible();
  await tabsStayVisible(page, 'Categories');
  await page.getByRole('tab', { name: 'Home', exact: true }).click();
  await tabsStayVisible(page, 'Home');
  await page.getByRole('tab', { name: 'Categories', exact: true }).click();
  await expect(page).toHaveURL(listingUrl);
  // Scroll the screen's own scroller, not the browser document.
  const scroll = page.getByRole('button', { name: /^View / }).first().locator('xpath=ancestor::*').filter({ visible: true });
  await scroll.evaluateAll(elements => {
    const scroller = elements.find(element => element.scrollHeight > element.clientHeight && getComputedStyle(element).overflowY === 'auto');
    scroller?.scrollTo(0, scroller.scrollHeight);
  });
  await tabsStayVisible(page, 'Categories');
  const tabTop = (await page.getByRole('tab').first().boundingBox())!.y;
  const lastProduct = page.getByRole('button', { name: /^View / }).last();
  await lastProduct.scrollIntoViewIfNeeded();
  const productBox = await lastProduct.boundingBox();
  expect(productBox!.y + productBox!.height).toBeLessThanOrEqual(tabTop);
  await page.getByRole('button', { name: '‹ Back', exact: true }).click();
  await expect(page).toHaveURL(/\/category\//);
  await tabsStayVisible(page, 'Categories');
  expect(errors).toEqual([]);
});
