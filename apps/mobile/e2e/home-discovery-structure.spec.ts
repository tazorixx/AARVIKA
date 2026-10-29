import {test, expect} from '@playwright/test';

for (const width of [320, 390]) {
  test(`existing mobile Home uses the new gift discovery structure at ${width}px`, async ({page}) => {
    await page.setViewportSize({width, height: 844});
    await page.goto('/', {waitUntil: 'domcontentloaded'});
    await expect(page.getByTestId('home-discovery')).toBeVisible();
    await expect(page.getByTestId('home-editorial-hero')).toBeVisible();
    await expect(page.getByText('Gifts for every occasion')).toBeVisible();
    await expect(page.getByText('Shop by gift style')).toBeVisible();
    await expect(page.getByText('Gifts for your people')).toBeVisible();
    await expect(page.getByRole('tab')).toHaveCount(5);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    await page.screenshot({path: `evidence/home-reference-${width}.png`, fullPage: true});
    await page.mouse.move(width / 2, 500);
    await page.mouse.wheel(0, 700);
    await page.screenshot({path: `evidence/home-reference-${width}-middle.png`});
    await page.mouse.wheel(0, 900);
    await page.screenshot({path: `evidence/home-reference-${width}-bottom.png`});
  });
}

test('occasion and department shortcuts open the existing app screens', async ({page}) => {
  await page.goto('/', {waitUntil: 'domcontentloaded'});
  await page.getByRole('button', {name: 'Explore Wedding gifts'}).click();
  await expect(page).toHaveURL(/\/department\/wedding/);
  await page.goto('/', {waitUntil: 'domcontentloaded'});
  await page.getByRole('button', {name: 'Explore Clothing'}).last().click();
  await expect(page).toHaveURL(/\/department\/clothing/);
});
