/* global __dirname */
/* eslint-disable @typescript-eslint/no-require-imports -- Reuses existing workspace QA tooling without adding app dependencies. */
const { chromium } = require('../../apps/mobile/node_modules/@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const stage = process.argv[2] || 'before';
const only=process.argv[3];
if(only&&!/^[a-z0-9-]+$/.test(only))throw new Error('Use a known route name.');
if (!/^[a-z0-9-]+$/.test(stage)) throw new Error('Use a simple local evidence stage name.');
const folder = path.resolve(__dirname, '../evidence', stage);
fs.mkdirSync(folder, { recursive: true });
(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage(), errors = [], external = [], layout = [];
  page.setDefaultTimeout(120000);
  page.on('pageerror', error => errors.push(error.message));
  await context.route('**/*', route => {
    const u = new URL(route.request().url());
    if (['127.0.0.1', 'localhost'].includes(u.hostname) || ['data:', 'blob:'].includes(u.protocol)) return route.continue();
    external.push(u.hostname); return route.abort();
  });
  try {
    await page.goto('http://127.0.0.1:3100/admin/login', { waitUntil: 'domcontentloaded' });
    await page.getByLabel('Email', { exact: true }).fill('owner@aarvika.invalid');
    await page.locator('input[type=password]').fill('Local-demo-only-2026!');
    await page.getByRole('button', { name: 'Sign in to Admin', exact: true }).click();
    await page.locator('.admin-sidebar').waitFor();
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
      for (const [name, route] of [['dashboard','/admin'],['products','/admin/products'],['add-product','/admin/products/new'],['edit-product','/admin/products/local-demo-product/edit'],['categories','/admin/categories'],['collections','/admin/collections'],['inventory','/admin/inventory'],['homepage','/admin/homepage'],['homepage-preview','/admin/homepage/preview'],['wedding','/admin/merchandising/wedding'],['support','/admin/support']].filter(([name])=>!only||name===only)) {
        await page.goto('http://127.0.0.1:3100' + route, { waitUntil: 'domcontentloaded' });
        await page.locator('.admin-sidebar').waitFor();
        await page.waitForLoadState('networkidle');
        await page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].map(i => i.decode())); });
        await page.screenshot({ path: path.join(folder, `${name}-${width}.png`), fullPage: true });
        layout.push({ name, width, geometry: await page.evaluate(() => Object.fromEntries(['.admin-sidebar','.admin-header','.admin-content-inner'].map(s => { const r=document.querySelector(s)?.getBoundingClientRect();return [s,r?{x:r.x,y:r.y,width:r.width}:null];}))) });
      }
    }
    fs.writeFileSync(path.join(folder, 'metrics.json'), JSON.stringify({ errors, external, layout }, null, 2));
    if (errors.length || external.length) throw new Error(`QA detected ${errors.length} page errors and ${external.length} external requests.`);
    console.log(`Captured ${layout.length} copied admin views; no page errors or external requests.`);
  } catch(error) { fs.writeFileSync(path.join(folder,"failure.json"),JSON.stringify({message:error.message,url:page.url(),errors,external},null,2));await page.screenshot({path:path.join(folder,"failure.png"),fullPage:true});throw error; } finally { await browser.close(); }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
