/* Local desktop/mobile visual and interaction check. Requires installed Chrome. */
const { chromium } = require('../../mobile/node_modules/playwright');
const fs = require('node:fs');
const path = require('node:path');
const output = path.join(__dirname, '..', 'evidence');
fs.mkdirSync(output, { recursive: true });
(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--no-sandbox'] });
  const errors = [];
  for (const width of [1440, 768, 390, 320]) {
    const page = await browser.newPage({ viewport: { width, height: width === 1440 ? 900 : 844 }, deviceScaleFactor: 1 });
    page.on('pageerror', error => errors.push(`${width}px: ${error.message}`));
    await page.goto('http://127.0.0.1:4173/', { waitUntil: 'networkidle' });
    await page.locator('.hero').waitFor();
    await page.screenshot({ path: path.join(output, `home-${width}.png`), fullPage: true });
    const size = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth }));
    if (size.document > size.viewport + 2) throw new Error(`${width}px horizontal overflow: ${JSON.stringify(size)}`);
    if (width === 390) {
      await page.getByRole('link', { name: 'Categories', exact: true }).last().click();
      await page.getByRole('heading', { name: 'Shop by category' }).waitFor();
      await page.screenshot({ path: path.join(output, 'categories-390.png'), fullPage: true });
      await page.locator('.department-grid').first().getByRole('link', { name: /Wedding/ }).click();
      await page.getByRole('heading', { name: 'Wedding', exact: true }).waitFor();
      await page.locator('.listing-grid .product-card').first().locator('.product-image').click();
      await page.locator('.detail-copy h1').waitFor();
      await page.screenshot({ path: path.join(output, 'product-390.png'), fullPage: true });
      await page.locator('.detail-copy [data-action="add"]').click();
      await page.locator('#cart-count:not([hidden])').waitFor();
      await page.locator('.header-actions a[href*="cart"]').click();
      await page.getByRole('heading', { name: 'Your gift bag' }).waitFor();
      await page.screenshot({ path: path.join(output, 'bag-390.png'), fullPage: true });
      await page.locator('#search-input').fill('mug');
      await page.locator('#search-form button').click();
      await page.locator('.listing-grid .product-card').first().waitFor();
      await page.locator('.listing-grid .product-card').first().locator('[data-action="wish"]').click();
      await page.locator('.mobile-nav a[href*="wishlist"]').click();
      await page.getByRole('heading', { name: 'Your wishlist' }).waitFor();
      if (await page.locator('.listing-grid .product-card').count() < 1) throw new Error('Wishlist did not retain a searched product.');
    }
    await page.close();
  }
  const response = await fetch('http://127.0.0.1:4173/api/catalog');
  const catalogue = await response.json();
  if (catalogue.source === 'admin') {
    const uploaded = catalogue.data.products.find(product => product.media?.[0]?.path?.startsWith('/demo-uploads/'));
    if (uploaded) {
      const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
      page.on('pageerror', error => errors.push(`admin image: ${error.message}`));
      await page.goto(`http://127.0.0.1:4173/?view=product&id=${encodeURIComponent(uploaded.id)}`, { waitUntil: 'networkidle' });
      await page.locator('.detail-image img').waitFor();
      const loaded = await page.locator('.detail-image img').evaluate(image => image.complete && image.naturalWidth > 0);
      if (!loaded) throw new Error('Admin-uploaded product image did not load in the website.');
      await page.screenshot({ path: path.join(output, 'admin-upload-product-390.png'), fullPage: true });
      await page.close();
    }
  }
  await browser.close();
  if (errors.length) throw new Error(errors.join('\n'));
  console.log('Browser QA passed: 1440/768/390/320 home, no horizontal overflow or page errors; mobile categories → department → product → demo bag, search and wishlist; admin-uploaded image checked when available.');
})().catch(error => { console.error(error); process.exitCode = 1; });
