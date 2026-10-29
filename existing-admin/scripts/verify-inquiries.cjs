/* eslint-disable @typescript-eslint/no-require-imports -- Guarded local inquiry checks. */
const assert=require('node:assert/strict'),fs=require('node:fs');
require('./isolated-env.cjs').isolatedEnv();
const {chromium,expect}=require('../../apps/mobile/node_modules/@playwright/test');
const base='http://127.0.0.1:3100';let checks=0;
async function token(email){const r=await fetch('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=demo-aarvika-local-key',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password:'Local-demo-only-2026!',returnSecureToken:true})});assert.equal(r.status,200);return (await r.json()).idToken;}
(async()=>{
 const owner=await token('owner@aarvika.invalid'),support=await token('support@aarvika.invalid'),catalogue=await token('catalogue@aarvika.invalid');
 async function api(path,method='GET',body,status=200,credential=owner){const r=await fetch(base+path,{method,headers:{Authorization:'Bearer '+credential,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});const data=await r.json();assert.equal(r.status,status,JSON.stringify(data));checks++;return data;}
 assert.equal((await fetch(base+'/api/admin/furniture-inquiries')).status,401);checks++;
 await api('/api/admin/furniture-inquiries','GET',undefined,403,catalogue);
 const list=await api('/api/admin/furniture-inquiries','GET',undefined,200,support),row=list.inquiries.find(r=>r.id==='demo-custom-console');assert.ok(row);assert.equal(row.demo,true);
 const patch={revision:row.revision,status:'reviewing',internalNote:'Synthetic request inspected; no message sent',quotePaise:0};
 const updated=await api('/api/admin/furniture-inquiries/'+row.id,'PATCH',patch);assert.equal(updated.notificationSent,false);assert.equal(updated.paymentsEnabled,false);
 await api('/api/admin/furniture-inquiries/'+row.id,'PATCH',patch,400);
 await api('/api/admin/furniture-inquiries/'+row.id,'PATCH',{...patch,revision:row.revision+1,status:'demo-quote',quotePaise:0},400);
 const history=await api('/api/admin/furniture-inquiries/'+row.id);assert.ok(history.history.some(e=>e.revision===row.revision+1));
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true}),context=await browser.newContext({viewport:{width:390,height:844}}),page=await context.newPage(),errors=[],external=[];
 page.setDefaultTimeout(45000);page.on('pageerror',e=>errors.push(e.message));await context.route('**/*',route=>{const u=new URL(route.request().url());if(['127.0.0.1','localhost'].includes(u.hostname)||['data:','blob:'].includes(u.protocol))return route.continue();external.push(u.hostname);return route.abort();});
 fs.mkdirSync('evidence/inquiries',{recursive:true});let family;
 try{
  await page.goto(base+'/admin/login');await page.getByLabel('Email',{exact:true}).fill('owner@aarvika.invalid');await page.locator('input[type=password]').fill('Local-demo-only-2026!');await page.getByRole('button',{name:'Sign in to Admin',exact:true}).click();await page.locator('.admin-sidebar').waitFor();await page.goto(base+'/admin/support');
  await page.getByText('Furniture inquiries · local demo',{exact:true}).click();await page.getByRole('combobox',{name:/Inquiry review state/}).selectOption('demo-quote');await page.getByLabel('Internal demo quote (₹)',{exact:true}).fill('19999.95');await page.getByLabel('Internal review notes',{exact:true}).fill('Internal demonstration estimate only; not sent.');await page.getByRole('button',{name:'Save internal demo review',exact:true}).click();await expect(page.getByRole('status')).toHaveText('Internal demo review saved. No quote or message was sent.');await page.getByRole('button',{name:'View inquiry history',exact:true}).click();await page.getByText(/Revision .*demo-quote.*Internal demonstration/).first().waitFor();
  for(const width of [1440,390]){await page.setViewportSize({width,height:width===390?844:1000});await page.evaluate(()=>Promise.all([...document.images].map(i=>i.decode())));await page.screenshot({path:`evidence/inquiries/support-${width}.png`,fullPage:true});}
  family=await api('/api/admin/categories','POST',{name:'Demo custom office family',slug:'demo-custom-office-'+Date.now(),departmentId:'furniture',parentId:'furniture-root',furnitureSector:'Commercial',active:true},201);
  const visible=await (await fetch(base+'/api/mobile/v2/catalog')).json();assert.ok(visible.data.categories.some(c=>c.id===family.id&&c.level===2&&c.furnitureSector==='Commercial'));
  const mobile=await browser.newContext({viewport:{width:390,height:844}}),mp=await mobile.newPage();mp.setDefaultTimeout(45000);mp.on('pageerror',e=>errors.push(e.message));await mobile.route('**/*',route=>{const u=new URL(route.request().url());if(['127.0.0.1','localhost'].includes(u.hostname)||['data:','blob:'].includes(u.protocol))return route.continue();external.push(u.hostname);return route.abort();});
  await mp.goto('http://127.0.0.1:8084/furniture/inquiry');await mp.getByRole('button',{name:/^(✓ )?Demo custom office family$/}).click();
  for(const [label,value] of [['Required width','120'],['Required depth','60'],['Required height','80'],['Requested material','Wood'],['Furniture budget (₹)','15000'],['Furniture delivery PIN','411001'],['Design requirements','Synthetic dynamic-family design']])await mp.getByRole('textbox',{name:label,exact:true}).fill(value);
  await mp.getByRole('button',{name:'Save inquiry locally',exact:true}).click();await mp.getByText('Custom design · Revision 1',{exact:true}).waitFor();await mp.screenshot({path:'evidence/inquiries/mobile-dynamic-family-390.png',fullPage:true});await mobile.close();
  await api('/api/admin/categories/'+family.id,'DELETE');family=undefined;
  assert.deepEqual(errors,[]);assert.deepEqual(external,[]);console.log(`${checks} inquiry HTTP checks plus browser review/history and dynamic mobile family persistence passed; Support permission retained, catalogue-manager/anonymous denied, stale edits rejected, no customer notification/payment or external request.`);
 }catch(e){await page.screenshot({path:'evidence/inquiries/failure.png',fullPage:true});throw e;}finally{if(family)await api('/api/admin/categories/'+family.id,'DELETE');await browser.close();}
})().catch(e=>{console.error(e.message);process.exitCode=1;});
