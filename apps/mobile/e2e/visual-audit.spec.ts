import { readyImages } from './capture';
import { test, expect } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const departments = ['wedding', 'birthday', 'personalized', 'anniversary', 'hampers', 'clothing', 'stationery', 'furniture'];
const folder = `evidence/visual-qa/${process.env.VISUAL_QA_STAGE ?? 'after'}`;
for (const width of [320, 390, 834, 1194]) {
  test(`live visual audit at ${width}px`, async ({ page }) => {
    test.setTimeout(180000);
    mkdirSync(folder, { recursive: true });
    const errors: string[] = [], external: string[] = [], observations: unknown[] = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.route('**/*', route => { const u = new URL(route.request().url()); if (['localhost', '127.0.0.1', '::1'].includes(u.hostname) || ['data:', 'blob:'].includes(u.protocol)) return route.continue(); external.push(u.hostname); return route.abort(); });
    await page.setViewportSize({ width, height: width >= 800 ? 1024 : 844 });
    for (const department of ['home', ...departments]) {
      await page.goto(department === 'home' ? '/' : `/department/${department}`, { waitUntil: 'domcontentloaded' });
      await expect(page.getByRole('button', { name: 'Search gifts', exact: true })).toBeVisible();
      if (department === 'home') await expect(page.getByText('Thoughtfully picked', { exact: true })).toBeVisible();
      else if (department === 'wedding') await expect(page.getByRole('button', { name: 'Explore Marathi Hindu', exact: true })).toBeVisible();
      else await expect(page.getByRole('button', { name: /^View / }).first()).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      await readyImages(page); await page.screenshot({ path: join(folder, `${department}-${width}-top.png`) });
      const metrics = await page.evaluate(() => {
        const buttons = [...document.querySelectorAll<HTMLElement>('[role="button"]')];
        const cards = buttons.filter(b => b.getAttribute('aria-label')?.startsWith('View '));
        const rect = (e: HTMLElement) => { const r = e.getBoundingClientRect(); const s = getComputedStyle(e); return { name: e.getAttribute('aria-label') ?? e.innerText, x: Math.round(r.x), y: Math.round(r.y), width: Math.round(r.width), height: Math.round(r.height), color: s.color, background: s.backgroundColor }; };
        const scroller = [...document.querySelectorAll<HTMLElement>('*')].find(e => getComputedStyle(e).overflowY === 'auto' && e.scrollHeight > e.clientHeight + 50);
        return { horizontalOverflow: document.documentElement.scrollWidth > innerWidth, firstProducts: cards.slice(0, 6).map(rect), tinyButtons: buttons.filter(b => { const r = b.getBoundingClientRect(); return r.width > 0 && r.height > 0 && (r.height < 43 || r.width < 43); }).map(rect), scrollContentHeight: scroller?.scrollHeight ?? 0 };
      });
      observations.push({ department, ...metrics });
      if (department !== 'wedding') { await page.getByRole('button', { name: /^View / }).first().scrollIntoViewIfNeeded(); await readyImages(page); await page.screenshot({ path: join(folder, `${department}-${width}-products.png`) }); }
      expect(metrics.horizontalOverflow).toBe(false);
      if (process.env.VISUAL_QA_STAGE !== 'before') expect(metrics.tinyButtons).toEqual([]);
    }
    writeFileSync(join(folder, `metrics-${width}.json`), JSON.stringify({ width, observations, errors, external }, null, 2));
    expect(errors).toEqual([]);
    expect(external).toEqual([]);
  });
}
