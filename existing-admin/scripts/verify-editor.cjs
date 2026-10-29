/* eslint-disable @typescript-eslint/no-require-imports -- Local browser verification. */
const assert=require('node:assert/strict');
const {chromium}=require('../../apps/mobile/node_modules/@playwright/test');
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 const context=await browser.newContext({viewport:{width:390,height:844}}),page=await context.newPage(),errors=[],external=[];
 page.setDefaultTimeout(120000);page.on('pageerror',e=>errors.push(e.message));
 await context.route('**/*',route=>{const u=new URL(route.request().url());if(['127.0.0.1','localhost'].includes(u.hostname)||['data:','blob:'].includes(u.protocol))return route.continue();external.push(u.hostname);return route.abort();});
 try{
  await page.goto('http://127.0.0.1:3100/admin/login');
  await page.getByLabel('Email',{exact:true}).fill('owner@aarvika.invalid');await page.locator('input[type=password]').fill('Local-demo-only-2026!');await page.getByRole('button',{name:'Sign in to Admin',exact:true}).click();await page.locator('.admin-sidebar').waitFor();
  await page.goto('http://127.0.0.1:3100/admin/products/new');
  await page.getByRole('checkbox',{name:'Stationery',exact:true}).check();
  await page.getByLabel('AARVIKA product type',{exact:true}).fill('paper');
  await page.getByLabel('Main department category',{exact:true}).selectOption('stationery-root');
  assert.equal(await page.getByRole('checkbox').count()>=8,true);
  await page.getByRole('checkbox',{name:'Birthday',exact:true}).check();
  await page.getByLabel('Minimum age',{exact:true}).fill('8');await page.getByLabel('Maximum age',{exact:true}).fill('18');
  await page.getByLabel('Interests · comma separated',{exact:true}).pressSequentially('Books, Art');assert.equal(await page.getByLabel('Interests · comma separated',{exact:true}).inputValue(),'Books, Art');
  await page.getByRole('checkbox',{name:'Clothing',exact:true}).check();await page.getByRole('checkbox',{name:'Configure size guide',exact:true}).check();await page.getByRole('button',{name:'Add size measurement',exact:true}).click();await page.getByLabel('size',{exact:true}).fill('M');
  await page.getByRole('checkbox',{name:'Configure typed personalization',exact:true}).check();await page.getByRole('button',{name:'Add personalization field',exact:true}).click();
  await page.getByRole('checkbox',{name:'Hampers',exact:true}).check();await page.getByRole('checkbox',{name:'Configure component SKUs and packaging',exact:true}).check();
  await page.getByLabel('Title',{exact:true}).fill('Demo browser draft '+Date.now());
  await page.getByRole('button',{name:'Open admin menu',exact:true}).click();page.once('dialog',dialog=>dialog.dismiss());await page.getByRole('button',{name:'Sign out',exact:true}).last().click();assert.match(page.url(),/products\/new/);await page.getByRole('button',{name:'Open admin menu',exact:true}).click();
  await page.getByRole('button',{name:'Preview product',exact:true}).click();await page.getByRole('dialog',{name:'Demo product preview'}).waitFor();assert.equal(await page.getByRole('button',{name:'Close preview',exact:true}).evaluate(e=>e===document.activeElement),true);await page.keyboard.press('Tab');assert.equal(await page.getByRole('button',{name:'Close preview',exact:true}).evaluate(e=>e===document.activeElement),true);await page.keyboard.press('Escape');
  page.once('dialog',dialog=>dialog.dismiss());await page.getByRole('link',{name:'Back',exact:true}).click();assert.match(page.url(),/products\/new/);
  await page.getByRole('button',{name:'Save as draft',exact:true}).click();await page.waitForURL('**/admin/products');
  await page.goto('http://127.0.0.1:3100/admin/products/new');await page.getByLabel('Title',{exact:true}).fill('Demo discard confirmation');let prompts=0;const accept=async dialog=>{prompts++;await dialog.accept();};page.on('dialog',accept);await page.getByRole('link',{name:'Back',exact:true}).click();await page.waitForURL('**/admin/products');page.off('dialog',accept);assert.equal(prompts,1,'One confirmation per accepted navigation');
  await page.goto('http://127.0.0.1:3100/admin/categories');await page.getByLabel('Mobile department',{exact:true}).waitFor();
  assert.equal(errors.length,0,errors.join('\n'));assert.equal(external.length,0,external.join(','));
  console.log('Browser passed: eight-department editor, canonical category, unsaved preview/Escape, leave protection, incomplete draft persistence, taxonomy control; 390px, no runtime errors or external requests.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e.message);process.exitCode=1;});
