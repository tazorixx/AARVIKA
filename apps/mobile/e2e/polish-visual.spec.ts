import { readyImages } from './capture';
import { test, expect } from '@playwright/test';
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
const stage=process.env.POLISH_STAGE??'after';
test.describe.configure({mode:'parallel'});
const departments=['wedding','birthday','personalized','anniversary','hampers','clothing','stationery','furniture'];
for(const width of [320,390,430,834,1194])test(`screen catalogue ${stage} ${width}px`,async({page})=>{
  test.setTimeout(600000);const folder=`evidence/polish/${stage}`;mkdirSync(folder,{recursive:true});
  const errors:string[]=[],external:string[]=[],metrics:unknown[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',route=>{const u=new URL(route.request().url());if(['localhost','127.0.0.1'].includes(u.hostname)||['data:','blob:'].includes(u.protocol))return route.continue();external.push(u.hostname);return route.abort();});
  await page.setViewportSize({width,height:width>=800?1024:844});
  await page.goto('/product/cotton-kurta',{waitUntil:'domcontentloaded'});await page.getByRole('button',{name:'Add to demo cart',exact:true}).click();
  await page.getByRole('button',{name:'♡ Save to wishlist',exact:true}).click();
  await page.goto('/account',{waitUntil:'domcontentloaded'});await page.getByRole('button',{name:'Continue with local demo profile'}).click();await page.getByRole('textbox',{name:'Demo profile name',exact:true}).fill('Visual Demo');await page.getByRole('button',{name:'Open demo profile',exact:true}).click();await page.getByRole('button',{name:'App settings',exact:true}).click();await expect(page.getByRole('button',{name:'Leave demo profile',exact:true})).toBeVisible();
  const routes:[string,string][]=[['home','/'],['categories','/categories'],['search','/search'],['main-category','/category/stationery-root'],['subcategory','/category/stationery-2'],['child-category','/category/stationery-2-1'],['product','/product/cotton-kurta'],['wishlist','/wishlist'],['cart','/cart'],['account','/account'],['personalization','/product/name-mug'],['hamper-builder','/builder'],...departments.map(d=>[`department-${d}`,`/department/${d}`] as [string,string]),['furniture-inquiry','/furniture/inquiry'],['furniture-requests','/furniture/requests'],['wedding-listing','/wedding/products'],['wedding-tradition','/wedding/tradition/marathi-hindu'],['wedding-function','/wedding/function/marathi-hindu-1-sakharpuda'],['offers','/offers'],['missing-product','/product/missing'],['missing-route','/not-a-real-route']];
  if(stage!=='before')routes.push(['review','/review']);
  for(const [name,url]of routes.filter(([name])=>!process.env.POLISH_CAPTURE_ONLY||process.env.POLISH_CAPTURE_ONLY.split(',').includes(name))){
    await page.goto(url,{waitUntil:'domcontentloaded'});if(name!=='account')await expect(page.getByRole('button',{name:'Search gifts',exact:true})).toBeEnabled();
    if(name==='home')await expect(page.getByText('Thoughtfully picked',{exact:true})).toBeVisible();
    if(['search','main-category','subcategory','child-category'].includes(name))await expect(page.getByRole('textbox',{name:'Search catalogue',exact:true})).toBeVisible();
    if(name==='personalization'){await expect(page.getByRole('textbox',{name:'Name to print *',exact:true})).toBeVisible();await page.getByRole('textbox',{name:'Name to print *',exact:true}).fill('Aarvika');await page.getByText('Make it personal',{exact:true}).scrollIntoViewIfNeeded();}
    if(['search','main-category','subcategory','child-category','wedding-listing'].includes(name)||name.startsWith('department-')&&name!=='department-wedding')await expect(page.getByText(/demo designs · prices are previews/)).toBeVisible();
    if(name==='missing-product')await expect(page.getByText('Product unavailable',{exact:true})).toBeVisible();
    if(name==='product')await expect(page.getByRole('button',{name:'Add to demo cart',exact:true})).toBeVisible();
    await readyImages(page); await page.screenshot({path:`${folder}/${name}-${width}.png`});
    const m=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,buttons:[...document.querySelectorAll<HTMLElement>('[role="button"]')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&(r.width<43||r.height<43);}).map(e=>e.getAttribute('aria-label')??e.textContent)}));metrics.push({name,...m});expect(m.overflow).toBe(false);
    if(['account','hamper-builder','furniture-inquiry','product','cart','personalization'].includes(name)){const buttons=page.getByRole('button');await buttons.last().scrollIntoViewIfNeeded();await readyImages(page); await page.screenshot({path:`${folder}/${name}-end-${width}.png`});}
  }
  const previous=process.env.POLISH_CAPTURE_ONLY&&existsSync(`${folder}/metrics-${width}.json`)?JSON.parse(readFileSync(`${folder}/metrics-${width}.json`,'utf8')):{metrics:[]};writeFileSync(`${folder}/metrics-${width}.json`,JSON.stringify({width,metrics:[...previous.metrics,...metrics],errors,external},null,2));expect(errors).toEqual([]);expect(external).toEqual([]);
});
