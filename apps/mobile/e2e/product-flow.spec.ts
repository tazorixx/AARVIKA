import {test, expect} from '@playwright/test';
import {readyImages} from './capture';

for (const width of [320, 390]) {
  test(`product details, related designs and sticky actions fit ${width}px`, async ({page}) => {
    await page.setViewportSize({width, height: 844});
    await page.goto('/product/cotton-kurta', {waitUntil: 'domcontentloaded'});
    await expect(page.getByTestId('product-gallery-main')).toBeVisible();
    await expect(page.getByRole('button', {name: 'Add to demo cart', exact: true})).toBeVisible();
    await expect(page.getByRole('button', {name: 'Review now', exact: true})).toBeVisible();
    await page.getByRole('button', {name: 'Large · Cream', exact: true}).click();
    await expect(page.getByRole('button', {name: 'Large · Cream', exact: true}).getByText('₹1,399')).toBeVisible();
    await readyImages(page);
    await page.screenshot({path: `evidence/product-flow-top-${width}.png`});
    await page.getByTestId('product-gallery-main').click();
    await expect(page.getByText('Illustrative demo design')).toBeVisible();
    await page.getByRole('button', {name: 'Close product image'}).click();
    await expect(page.getByRole('button', {name: 'Close product image'})).toBeHidden();
    await page.getByRole('button', {name: 'Product details'}).click();
    await expect(page.getByText('Fabric: Cotton', {exact: true}).first()).toBeVisible();
    await page.mouse.move(width / 2, 500);
    await page.mouse.wheel(0, 1100);
    await expect(page.getByText('You may also like')).toBeVisible();
    await expect(page.getByRole('button', {name: 'Review now', exact: true})).toBeInViewport();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
    await readyImages(page);
    await page.screenshot({path: `evidence/product-flow-related-${width}.png`});
  });
}

test('review action adds the selected SKU and opens only the local demo review', async ({page}) => {
  await page.goto('/product/cotton-kurta', {waitUntil: 'domcontentloaded'});
  await page.getByRole('button', {name: 'Large · Cream', exact: true}).click();
  await page.getByRole('button', {name: 'Review now', exact: true}).click();
  await expect(page).toHaveURL(/\/review/);
  await expect(page.getByText('LOCAL REVIEW · NOT AN ORDER')).toBeVisible();
  await expect(page.getByText(/1 × Large · Cream/)).toBeVisible();
});

test('quote-only products offer inquiry rather than cart or demo review', async ({page}) => {
  await page.goto('/product/custom-console', {waitUntil: 'domcontentloaded'});
  await expect(page.getByRole('button', {name: 'Request furniture quote'})).toBeVisible();
  await expect(page.getByRole('button', {name: 'Add to demo cart'})).toHaveCount(0);
  await expect(page.getByRole('button', {name: 'Review now'})).toHaveCount(0);
});
