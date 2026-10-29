import { readyImages } from './capture';
import { test, expect } from '@playwright/test';
test.skip(process.env.E2E_DATA_MODE !== 'local-api', 'Local API opt-in suite; fixture regression remains separate.');
const api='http://127.0.0.1:3001';
test('local API bootstrap failure/retry, server-owned data, empty search and HTTP recovery',async({page})=>{
  const errors:string[]=[],external:string[]=[],requests:string[]=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('request',r=>{const u=new URL(r.url());if(u.protocol.startsWith('http')&&!['localhost','127.0.0.1'].includes(u.hostname))external.push(u.hostname);if(r.url().startsWith(api))requests.push(r.url());});
  let fail=true;
  await page.route(`${api}/v1/catalog/bootstrap`,async route=>{
    if(fail){fail=false;return route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:{code:'TEMPORARY',message:'demo failure',retryable:true}})});}
    const response=await route.fetch(),body=await response.json();
    body.data.products.find((p:{id:string})=>p.id==='gift-box').title='Server catalogue probe · demo';
    await route.fulfill({response,json:body});
  });
  await page.goto('/',{waitUntil:'domcontentloaded'});
  await expect(page.getByText('Catalogue unavailable',{exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'Search gifts',exact:true})).toBeDisabled();
  await expect(page.getByRole('button',{name:'Cart',exact:true})).toBeDisabled();
  await readyImages(page); await page.screenshot({path:'evidence/task-10a-api-error-390.png'});
  await page.getByRole('button',{name:'Try again',exact:true}).click();
  await expect(page.getByRole('button',{name:'View Server catalogue probe · demo',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Search gifts',exact:true}).click();
  await page.getByRole('textbox',{name:'Search catalogue',exact:true}).fill('zzzz-no-such-product');
  await expect(page.getByText('No matching gifts',{exact:true})).toBeVisible();
  await page.route(`${api}/v1/catalog/search?**`,route=>route.fulfill({status:503,contentType:'application/json',body:'{}'}));
  await page.getByRole('textbox',{name:'Search catalogue',exact:true}).fill('mug');
  await expect(page.getByText('Could not load products',{exact:true})).toBeVisible();
  await page.unroute(`${api}/v1/catalog/search?**`);
  await page.getByRole('button',{name:'Try again',exact:true}).click();
  await expect(page.getByRole('button',{name:'View Your-name ceramic mug',exact:true})).toBeVisible();
  expect(requests.some(r=>r.includes('/bootstrap'))).toBe(true);expect(requests.some(r=>r.includes('/search?'))).toBe(true);
  expect(errors).toEqual([]);expect(external).toEqual([]);
  await readyImages(page); await page.screenshot({path:'evidence/task-10a-api-recovery-390.png'});
});
