/* eslint-disable @typescript-eslint/no-require-imports -- Focused read-only login verification. */
const fs=require('node:fs');
const path=require('node:path');
const {parse}=require('dotenv');
const {chromium}=require('../../apps/mobile/node_modules/@playwright/test');

async function main(){
 const source=process.env.AARVIKA_SHARED_ENV_FILE;
 if(!source||!path.isAbsolute(source))throw Error('AARVIKA_SHARED_ENV_FILE is required.');
 const settings=parse(fs.readFileSync(source));
 if(settings.FIREBASE_PROJECT_ID!=='gift4u-4210f'||!settings.ADMIN_EMAIL||!settings.ADMIN_PASSWORD)throw Error('Verified shared admin credentials are unavailable.');
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 try{
  const context=await browser.newContext();
  const page=await context.newPage();
  await page.goto('http://127.0.0.1:3100/admin/login?next=%2Fadmin',{waitUntil:'domcontentloaded'});
  await page.getByRole('textbox',{name:'Email'}).fill(settings.ADMIN_EMAIL);
  await page.locator('input[type=password]').fill(settings.ADMIN_PASSWORD);
  await page.getByRole('button',{name:'Sign in to Admin'}).click();
  try { await page.waitForURL(url=>url.pathname==='/admin',{timeout:25000}); }
  catch (error) {
   const alert=await page.getByRole('alert').allTextContents();
   console.error('Admin login response:',alert.map(value=>value.trim()).join(' | ')||'(no visible alert)');
   console.error('Admin login path:',new URL(page.url()).pathname);
   throw error;
  }
  await page.getByRole('heading').first().waitFor({state:'visible',timeout:20000});
  console.log('Existing SUPER_ADMIN login: passed; admin dashboard visible.');
  await page.goto('http://127.0.0.1:3100/admin/merchandising/clothing',{waitUntil:'domcontentloaded'});
  await page.getByRole('heading',{name:'Clothing storefront'}).waitFor({state:'visible',timeout:15000});
  const label=await page.getByText('Real Firebase · gift4u-4210f').count();
  if(!label)throw Error('Shared environment label is missing.');
  console.log('Clothing department and shared environment label: passed.');
  await page.goto('http://127.0.0.1:3100/admin/merchandising/wedding',{waitUntil:'domcontentloaded'});
  await page.getByRole('heading',{name:'Wedding storefront'}).waitFor({state:'visible',timeout:15000});
  await page.getByRole('button',{name:/Wedding cultures 7/}).waitFor({state:'visible',timeout:15000});
  console.log('Existing Wedding merchandising records: passed; seven cultures visible.');
  await context.close();
 }finally{await browser.close();}
}
main().catch(error=>{console.error('Existing SUPER_ADMIN login: failed ('+(error.name||'error')+': '+String(error.message).split('\n')[0]+').');process.exitCode=1;});
