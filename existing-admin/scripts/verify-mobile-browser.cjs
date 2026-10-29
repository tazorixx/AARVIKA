/* eslint-disable @typescript-eslint/no-require-imports -- Local cross-app browser integration. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
require('./isolated-env.cjs').isolatedEnv();
const {chromium,expect}=require('../../apps/mobile/node_modules/@playwright/test');
(async()=>{
 const record=JSON.parse(fs.readFileSync('evidence/admin-mobile-demo-record.json','utf8'));
 const signed=await fetch('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=demo-aarvika-local-key',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'owner@aarvika.invalid',password:'Local-demo-only-2026!',returnSecureToken:true})});const {idToken}=await signed.json();
 async function product(){return (await fetch('http://127.0.0.1:3100/api/admin/products/'+record.id,{headers:{Authorization:'Bearer '+idToken}})).json();}
 async function edit(body){const r=await fetch('http://127.0.0.1:3100/api/admin/products/'+record.id,{method:'PATCH',headers:{Authorization:'Bearer '+idToken,'Content-Type':'application/json'},body:JSON.stringify(body)});assert.equal(r.status,200,JSON.stringify(await r.json()));}
 const initial=await product();if(initial.variants[0].price!==849.95||initial.status!=='live')await edit({...initial,status:'live',variants:initial.variants.map((v,i)=>i===0?{...v,price:849.95}:v)});record.title=(await product()).title;
 let section=await fetch('http://127.0.0.1:3100/api/admin/homepage/'+record.sectionId,{method:'PATCH',headers:{Authorization:'Bearer '+idToken,'Content-Type':'application/json'},body:JSON.stringify({type:'products',title:'Demo admin selected designs',productIds:[record.id],selection:'manual',limit:4,sortOrder:3})});
 if(section.status===404){const created=await fetch('http://127.0.0.1:3100/api/admin/homepage',{method:'POST',headers:{Authorization:'Bearer '+idToken,'Content-Type':'application/json'},body:JSON.stringify({type:'products',title:'Demo admin selected designs',productIds:[record.id],limit:4,sortOrder:3})});assert.equal(created.status,201);record.sectionId=(await created.json()).section.id;}
 else assert.equal(section.status,200);
 const published=await fetch('http://127.0.0.1:3100/api/admin/homepage/'+record.sectionId,{method:'PATCH',headers:{Authorization:'Bearer '+idToken,'Content-Type':'application/json'},body:JSON.stringify({action:'publish'})});assert.equal(published.status,200);fs.writeFileSync('evidence/admin-mobile-demo-record.json',JSON.stringify(record,null,2)+'\n');
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'}),page=await context.newPage(),errors=[],external=[],mobileFirebase=[];
 let fail=false;page.setDefaultTimeout(45000);page.on('pageerror',e=>errors.push(e.message));
 await context.route('**/*',route=>{const u=new URL(route.request().url());if(!['127.0.0.1','localhost'].includes(u.hostname)&&!['data:','blob:'].includes(u.protocol)){external.push(u.hostname);return route.abort();}if(['8080','9099'].includes(u.port))mobileFirebase.push(u.port);if(fail&&u.pathname==='/api/mobile/v2/catalog')return route.abort();return route.continue();});
 async function ready(){await expect(page.getByRole('button',{name:'Search gifts',exact:true})).toBeEnabled();await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(image=>image.decode()));await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));});}
 const folder='evidence/mobile-emulator';fs.mkdirSync(folder,{recursive:true});
 try{
  await page.goto('http://127.0.0.1:8084',{waitUntil:'domcontentloaded'});
  await page.getByRole('button',{name:'View '+record.title,exact:true}).waitFor();await ready();await page.screenshot({path:path.join(folder,'home-390.png'),fullPage:true});
  await page.getByRole('button',{name:'View '+record.title,exact:true}).click();await page.getByText(/849.95.*demo price/).waitFor();
  await page.getByRole('button',{name:/Size · L/}).click();await page.getByText('Sold out in demo catalogue',{exact:true}).waitFor();assert.equal(await page.getByRole('button',{name:'Sold out',exact:true}).isDisabled(),true);
  await page.getByRole('button',{name:/Size · M/}).click();await page.getByRole('button',{name:'Add to demo cart',exact:true}).click();await page.getByText('Added to your demo cart.',{exact:true}).waitFor();
  let p=await product();const nextTitle=p.title.replace(/ · browser refreshed/g,'')+' · browser refreshed';p.variants[0].price=869.95;await edit({...p,title:nextTitle});await page.getByText(/869.95.*demo price/).waitFor();await page.getByRole('heading',{name:nextTitle,exact:true}).waitFor();
  await ready();await page.screenshot({path:path.join(folder,'product-390.png'),fullPage:true});
  await page.goto('http://127.0.0.1:8084/cart');await page.getByText('Demo price changed. Review recalculates from the current catalogue.',{exact:true}).waitFor();
  await page.goto('http://127.0.0.1:8084/product/'+record.id);await page.getByRole('heading',{name:nextTitle,exact:true}).waitFor();
  p=await product();await edit({...p,status:'draft'});await page.getByText('Product unavailable',{exact:true}).waitFor();
  await page.goto('http://127.0.0.1:8084/cart');await page.getByText('SKU no longer published',{exact:true}).waitFor();await expect(page.getByRole('button',{name:'Review demo order',exact:true})).toBeDisabled();await expect(page.getByText('undefined components',{exact:true})).toHaveCount(0);await ready();await page.screenshot({path:path.join(folder,'cart-unpublished-390.png'),fullPage:true});await page.getByRole('button',{name:'Remove unavailable product',exact:true}).click();await page.getByText('Your cart is empty',{exact:true}).waitFor();
  p=await product();await edit({...p,status:'live'});await page.goto('http://127.0.0.1:8084');await page.getByRole('button',{name:'View '+nextTitle,exact:true}).waitFor();
  fail=true;await page.getByText(/Showing the last demo snapshot/).waitFor();fail=false;await page.getByRole('button',{name:'Retry catalogue refresh',exact:true}).click();await page.getByText(/Showing the last demo snapshot/).waitFor({state:'hidden'});
  for(const width of [320,390,768]){
   await page.setViewportSize({width,height:width===768?1024:844});
   for(const [name,route] of [['categories','/categories'],...['wedding','birthday','personalized','anniversary','hampers','clothing','stationery','furniture'].map(id=>[id,'/department/'+id])]){
    await page.goto('http://127.0.0.1:8084'+route,{waitUntil:'domcontentloaded'});await page.getByText('AARVIKA',{exact:true}).first().waitFor();
    await expect(page.getByRole('button',{name:'Search gifts',exact:true})).toBeEnabled();
    if(!['categories','wedding'].includes(name))await expect(page.getByText(/demo designs · prices are previews/)).toBeVisible();
    if(name==='wedding')await expect(page.getByRole('heading',{name:'Wedding',exact:true})).toBeVisible();
    await ready();
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'Root overflow '+name+' '+width);
    await page.screenshot({path:path.join(folder,`${name}-${width}.png`),fullPage:true});
   }
  }
  assert.deepEqual(errors,[]);assert.deepEqual(external,[]);assert.deepEqual(mobileFirebase,[]);
  fs.writeFileSync(path.join(folder,'results.json'),JSON.stringify({errors,external,mobileFirebase,screenshots:30,flows:['published home product','SKU price/stock','cart','live demo edit refresh','unpublish removes open product','offline snapshot/retry','all eight departments at 320/390/768','reduced motion']},null,2)+'\n');
  console.log('Mobile emulator browser passed: published product/homepage, variant sold-out/cart, visible edit/unpublish refresh, failure/retry; 30 screenshots at 320/390/768, eight departments, reduced motion, zero runtime errors/external requests/direct Firebase calls.');
 }catch(e){await page.screenshot({path:path.join(folder,'failure.png'),fullPage:true});console.error(JSON.stringify({url:page.url(),errors,external,mobileFirebase}));throw e;}finally{await browser.close();}
})().catch(e=>{console.error(e.message);process.exitCode=1;});
