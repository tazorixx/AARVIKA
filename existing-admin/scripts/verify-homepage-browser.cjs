/* eslint-disable @typescript-eslint/no-require-imports -- Local browser verification. */
const assert=require('node:assert/strict');
const {chromium}=require('../../apps/mobile/node_modules/@playwright/test');
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 const context=await browser.newContext({viewport:{width:390,height:844}}),page=await context.newPage(),errors=[],external=[];
 page.setDefaultTimeout(30000);page.on('pageerror',e=>errors.push(e.message));
 await context.route('**/*',route=>{const u=new URL(route.request().url());if(['127.0.0.1','localhost'].includes(u.hostname)||['data:','blob:'].includes(u.protocol))return route.continue();external.push(u.hostname);return route.abort();});
 try{
  await page.goto('http://127.0.0.1:3100/admin/login');
  await page.getByLabel('Email',{exact:true}).fill('owner@aarvika.invalid');await page.locator('input[type=password]').fill('Local-demo-only-2026!');await page.getByRole('button',{name:'Sign in to Admin',exact:true}).click();await page.locator('.admin-sidebar').waitFor();
  const alerts=[];page.on('dialog',async dialog=>{if(dialog.type()==='alert')alerts.push(dialog.message());await dialog.accept();});
  await page.goto('http://127.0.0.1:3100/admin/homepage');
  await page.getByText(/Published version [0-9]+/).waitFor();
  const initial=Number((await page.getByText(/Published version [0-9]+/).textContent()).match(/[0-9]+/)[0]);
  await page.getByRole('combobox',{name:/^Type/}).first().selectOption('products');
  await page.getByLabel('Title',{exact:true}).first().fill('Demo browser homepage '+Date.now());
  await page.getByRole('combobox',{name:/Product selection/}).first().selectOption('featured');
  const saveDraft=page.waitForResponse(r=>r.url().endsWith('/api/admin/homepage')&&r.request().method()==='POST');
  await page.getByRole('button',{name:'Save draft',exact:true}).first().click();assert.equal((await saveDraft).status(),201);
  const publication=page.waitForResponse(r=>r.url().endsWith('/api/admin/homepage/versions')&&r.request().method()==='POST');
  await page.getByRole('button',{name:'Publish saved layout',exact:true}).click();assert.equal((await publication).status(),200);
  await page.getByLabel('Homepage rollback version',{exact:true}).selectOption(String(initial));
  const rollback=page.waitForResponse(r=>r.url().endsWith('/api/admin/homepage/versions')&&r.request().method()==='POST');
  await page.getByRole('button',{name:'Rollback published layout',exact:true}).click();assert.equal((await rollback).status(),200);
  assert.deepEqual(alerts,[]);assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
  console.log('Homepage browser passed at 390px: product section source controls, save draft, publish saved layout and rollback; no alerts, runtime errors or external requests.');
 }catch(error){console.error(JSON.stringify({url:page.url(),errors,external}));await page.screenshot({path:".phase4-browser-failure.png",fullPage:true});throw error;}finally{await browser.close();}
})().catch(e=>{console.error(e.message);process.exitCode=1;});
