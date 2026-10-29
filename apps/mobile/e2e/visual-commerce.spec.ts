import {test,expect} from '@playwright/test';
test('visual landings for all eight departments retain shopping navigation and family counts',async({page})=>{
 const errors:string[]=[],adminRequests:string[]=[];page.on('pageerror',e=>errors.push(e.name));page.on('console',m=>{if(m.type()==='error'||m.text().includes('Require cycle'))errors.push(m.text());});
 await page.route('**/*',r=>{const u=new URL(r.request().url());if(u.port==='3100'){adminRequests.push(u.pathname);return r.abort();}return ['127.0.0.1','localhost'].includes(u.hostname)||['blob:','data:'].includes(u.protocol)?r.continue():r.abort();});
 for(const id of ['wedding','birthday','personalized','anniversary','hampers','clothing','stationery','furniture']){
  await page.goto('/department/'+id);await expect(page.getByTestId('commerce-hero')).toBeVisible();
  await expect(page.getByRole('heading',{name:'Explore gifts',exact:true})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
  const product=page.getByRole('button',{name:/^View /}).filter({has:page.locator('img')}).first();await expect(product).toBeVisible();await product.click();await expect(page.getByRole('heading',{name:'The thoughtful details',exact:true})).toBeVisible();
 }
 expect(errors).toEqual([]);expect(adminRequests).toEqual([]);
});
test('Wedding visual tradition and function preserve optional verification and kit cart',async({page})=>{
 await page.goto('/department/wedding');await page.getByRole('button',{name:'Explore Marathi Hindu',exact:true}).click();await expect(page.getByTestId('commerce-hero').filter({visible:true})).toBeVisible();
 await page.getByRole('button',{name:'Explore Sakharpuda',exact:true}).click();await page.getByRole('button',{name:'Plan this function',exact:true}).click();
 await expect(page.getByRole('button',{name:'Customize this function kit',exact:true})).toBeDisabled();await page.getByRole('switch',{name:'I will verify kit suitability with family',exact:true}).click();await page.getByRole('textbox',{name:'Return gift quantity',exact:true}).fill('3');await page.getByRole('button',{name:'Customize this function kit',exact:true}).click();await page.getByRole('button',{name:'3. Finish',exact:true}).click();await page.getByRole('button',{name:'Add gift box to demo cart',exact:true}).click();await page.getByRole('button',{name:'View gift box in cart',exact:true}).click();await expect(page.getByText('Cotton return-gift pouch × 3',{exact:true})).toBeVisible();
});
test('representative narrow/tablet layouts and commerce filter deep links',async({page})=>{
 await page.setViewportSize({width:320,height:844});await page.goto('/department/birthday');await page.getByRole('button',{name:'Explore Her',exact:true}).click();await expect(page.getByRole('textbox',{name:'Search catalogue',exact:true})).toBeVisible();await expect(page.getByRole('button',{name:/^View /}).first()).toBeVisible();
 await page.setViewportSize({width:768,height:1024});await page.goto('/department/stationery');await expect(page.getByTestId('commerce-hero')).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
});
