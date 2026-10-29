// Local QA artifact only; all images are captured from the running fixture app.
/* global __dirname */
const { chromium } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../evidence/visual-qa');
const departments = ['home', 'wedding', 'birthday', 'personalized', 'anniversary', 'hampers', 'clothing', 'stationery', 'furniture'];
const widths = [320, 390, 834, 1194];
const style = '<style>body{font:14px system-ui;background:#faf8fc;color:#3e155c;margin:16px}h1{font-size:22px}h2{font-size:18px}a{color:#62298e}main{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}figure{margin:0;background:white;border:1px solid #e9ddf7;padding:8px}figcaption{margin-bottom:8px}img{display:block;max-width:100%;max-height:550px;margin:auto}nav{display:flex;gap:12px;flex-wrap:wrap;margin:12px 0}</style>';
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  for (const width of widths) {
    const figures = departments.map(name => `<figure><figcaption>${name} · ${width}px · fixture</figcaption><img src="data:image/png;base64,${fs.readFileSync(path.join(root, 'after', `${name}-${width}-top.png`)).toString('base64')}"></figure>`).join('');
    await page.setContent(`${style}<h1>AARVIKA live Expo visual audit · ${width}px</h1><main>${figures}</main>`);
    await page.evaluate(() => Promise.all([...document.images].map(i => i.decode())));
    await page.screenshot({ path: path.join(root, `contact-${width}.png`), fullPage: true });
  }
  const sections = widths.map(width => `<h2>${width}px</h2><p><a href="contact-${width}.png">All department overview</a> · <a href="after/metrics-${width}.json">Measured results</a></p><main>${departments.map(name => `<figure><figcaption>${name}</figcaption><a href="after/${name}-${width}-top.png"><img loading="lazy" src="after/${name}-${width}-top.png"></a><nav><a href="before/${name}-${width}-top.png">Before</a>${name !== 'wedding' ? `<a href="after/${name}-${width}-products.png">Product grid</a>` : ''}</nav></figure>`).join('')}</main>`).join('');
  fs.writeFileSync(path.join(root, 'index.html'), `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>AARVIKA visual QA</title>${style}<h1>AARVIKA visual QA evidence</h1><p>Running Expo web, fixture mode. Browser viewports; native device testing remains outstanding. Screenshots include all eight departments and Home.</p>${sections}</html>`);
  await browser.close();
})();
