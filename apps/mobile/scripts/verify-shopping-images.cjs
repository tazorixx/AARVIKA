/* Focused loopback browser integration, no provider uploads. */
const {chromium,expect}=require('@playwright/test');
const {parseEnv}=require('node:util');
const fs=require('node:fs'),assert=require('node:assert/strict');
const env=parseEnv(fs.readFileSync('.env.local','utf8'));
const endpoint=env.EXPO_PUBLIC_IMAGEKIT_URL_ENDPOINT?.replace(/\/$/,'');
if(!endpoint||!/^https:\/\/ik\.imagekit\.io\/[^/]+$/.test(endpoint))throw Error('A standard public ImageKit endpoint is needed for this check; no value printed.');
const base='http://127.0.0.1:3100';
(async()=>{
 const snapshot=await(await fetch(base+'/api/mobile/v2/catalog')).json();
 assert.equal(snapshot.meta.projectId,'demo-aarvika-local');assert.equal(snapshot.meta.firebaseEnabled,'emulator-only');
 const product=snapshot.data.products.find(p=>p.title.includes('ceramic mug'))??snapshot.data.products.find(p=>p.purchaseMode==='buy'&&!p.prebuiltBundle);
 assert.ok(product?.demo);
 const auth=await(await fetch('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=demo-aarvika-local-key',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'owner@aarvika.invalid',password:'Local-demo-only-2026!',returnSecureToken:true})})).json();
 assert.ok(auth.idToken);const headers={Authorization:'Bearer '+auth.idToken,'Content-Type':'application/json'};
 const original=await(await fetch(base+'/api/admin/products/'+product.id,{headers})).json();assert.ok(original.slug.startsWith('demo-source-'));
 const cdn=endpoint+'/aarvika-local-transport-check.png';
 async function patch(media){const latest=await(await fetch(base+'/api/admin/products/'+product.id,{headers})).json();const response=await fetch(base+'/api/admin/products/'+product.id,{method:'PATCH',headers,body:JSON.stringify({...latest,...media})});assert.equal(response.status,200,'Demo image authoring update must pass');}
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 try{
  await patch({images:[{url:cdn,alt:'Local demo CDN transport image'}],thumbnail:cdn});
  const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce',deviceScaleFactor:2});
  const page=await context.newPage(),errors=[],requests=[],external=[];
  page.on('pageerror',e=>errors.push(e.name));
  await context.route('**/*',route=>{const url=new URL(route.request().url());if(url.origin===new URL(cdn).origin&&url.pathname===new URL(cdn).pathname){requests.push(url.searchParams.get('tr'));return route.fulfill({contentType:'image/png',body:fs.readFileSync('assets/demo-art/mug.png'),headers:{'Cache-Control':'public, max-age=86400'}});}if(['127.0.0.1','localhost'].includes(url.hostname)||['data:','blob:'].includes(url.protocol))return route.continue();external.push(url.hostname);return route.abort();});
  await page.goto('http://127.0.0.1:8086/search');
  const card=page.getByRole('button',{name:'View '+product.title,exact:true});await expect(card).toBeVisible({timeout:60000});await card.scrollIntoViewIfNeeded();
  const thumb=card.getByRole('img',{name:'Local demo CDN transport image',exact:true});await expect(thumb).toBeVisible();
  await expect.poll(()=>requests.some(tr=>/w-(300|350|400|450),/.test(tr||''))).toBeTruthy();
  const bounds=await thumb.boundingBox(),cardBounds=await card.boundingBox();assert.ok(bounds&&cardBounds&&bounds.width<=cardBounds.width&&bounds.height<=cardBounds.height,'Image stays inside compact card');
  assert.equal(await thumb.evaluate(node=>getComputedStyle(node).objectFit),'contain');
  await page.setViewportSize({width:320,height:844});await expect(thumb).toBeVisible();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),true,'No narrow-screen horizontal overflow');
  const source=await thumb.getAttribute('src');assert.match(decodeURIComponent(source),/c-at_max,f-auto,q-80/);
  await card.click();await expect(page.getByRole('button',{name:'Zoom product image',exact:true})).toBeVisible();
  await expect.poll(()=>requests.some(tr=>/w-(700|750|800|850|900|950|1000),/.test(tr||''))).toBeTruthy();
  assert.equal(requests.some(tr=>/w-(1[2-9]\d\d|2000),/.test(tr||'')),false,'No zoom download before opening');
  await page.getByRole('button',{name:'Zoom product image',exact:true}).click();
  await expect.poll(()=>requests.some(tr=>/w-(1[2-9]\d\d|2000),/.test(tr||''))).toBeTruthy();
  await page.getByRole('button',{name:'Close product image',exact:true}).click();
  const sameUrl=await page.getByRole('img',{name:'Local demo CDN transport image',exact:true}).getAttribute('src');
  await page.getByRole('button',{name:'Zoom product image',exact:true}).click();await page.getByRole('button',{name:'Close product image',exact:true}).click();
  assert.equal(await page.getByRole('img',{name:'Local demo CDN transport image',exact:true}).getAttribute('src'),sameUrl,'Stable URL/cache identity');
  await context.unrouteAll({behavior:'wait'});
  await context.route('**/*',route=>{const u=new URL(route.request().url());if(u.hostname==='ik.imagekit.io')return route.abort();if(['127.0.0.1','localhost'].includes(u.hostname)||['data:','blob:'].includes(u.protocol))return route.continue();return route.abort();});
  await page.reload();await expect(page.getByRole('img',{name:product.title+': illustrative demo artwork',exact:true})).toBeVisible();
  assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
  console.log('PASS: isolated admin ImageKit reference projects to mobile grid/detail; bounded thumb/detail, on-demand zoom, stable cache URLs and error fallback. CDN payload intercepted with labelled local artwork; no real merchant asset or CDN availability claimed. No unexpected external requests/runtime errors.');
 }finally{try{await patch({images:original.images,thumbnail:original.thumbnail});}finally{await browser.close();}}
})().catch(error=>{console.error('Focused image check failed ('+error.name+'); URL and credential values omitted.');process.exitCode=1;});
