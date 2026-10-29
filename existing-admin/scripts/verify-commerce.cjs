/* eslint-disable @typescript-eslint/no-require-imports -- Focused isolated media authoring/browser check. */
require('./isolated-env.cjs').isolatedEnv();
const {chromium,expect}=require('../../apps/mobile/node_modules/@playwright/test');
const assert=require('node:assert/strict'),fs=require('node:fs');
const base='http://127.0.0.1:3100';
(async()=>{
 const auth=await(await fetch('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=demo-aarvika-local-key',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'owner@aarvika.invalid',password:'Local-demo-only-2026!',returnSecureToken:true})})).json();assert.ok(auth.idToken);
 const headers={Authorization:'Bearer '+auth.idToken,'Content-Type':'application/json'},snapshot=async()=>{const v=await(await fetch(base+'/api/mobile/v2/catalog')).json();assert.equal(v.meta?.projectId,'demo-aarvika-local');return v.data;};
 const initial=await snapshot(),category=initial.categories.find(c=>c.departmentId==='wedding'&&c.level===1),path=base+'/api/admin/categories/'+category.id;
 const original=await(await fetch(path,{headers})).json();
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true}),admin=await browser.newPage({viewport:{width:1440,height:1000}}),mobile=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
 for(const page of [admin,mobile]){page.on('pageerror',e=>errors.push(e.name));page.on('console',m=>{if(m.type()==='error'||m.text().includes('Require cycle'))errors.push(m.text());});}
 let changed=false,restoreHomeVersion;
 try{
  await admin.goto(base+'/admin/login');await admin.getByLabel('Email',{exact:true}).fill('owner@aarvika.invalid');await admin.getByLabel('Password',{exact:true}).fill('Local-demo-only-2026!');await admin.getByRole('button',{name:'Sign in to Admin',exact:true}).click();await admin.waitForURL('**/admin');
  await admin.goto(base+'/admin/categories');const row=admin.locator('article').filter({has:admin.getByRole('heading',{name:category.name,exact:true})});await row.getByRole('button',{name:'Edit',exact:true}).click();await admin.getByText('Mobile visual content · draft / publish',{exact:true}).click();
  await admin.getByRole('textbox',{name:'Mobile image URL',exact:true}).fill('/demo-art/frame.png');await admin.getByRole('textbox',{name:'Mobile image description',exact:true}).fill('Published Wedding visual check');await admin.getByRole('textbox',{name:'Display title',exact:true}).fill('Wedding visual check');await admin.getByRole('button',{name:'Save visual draft',exact:true}).click();await expect(admin.getByRole('status')).toContainText('Visual draft saved');changed=true;
  assert.deepEqual((await snapshot()).categories.find(c=>c.id===category.id).visual,initial.categories.find(c=>c.id===category.id).visual,'Draft must stay private');
  await admin.getByRole('button',{name:'Publish saved visual',exact:true}).click();await expect(admin.getByRole('status')).toContainText('Published visual updated');assert.equal((await snapshot()).categories.find(c=>c.id===category.id).visual.imagePath,'/demo-art/frame.png');
  fs.mkdirSync('../apps/mobile/evidence/commerce',{recursive:true});await admin.getByRole('textbox',{name:'Mobile image URL',exact:true}).scrollIntoViewIfNeeded();await admin.screenshot({path:'../apps/mobile/evidence/commerce/admin-media-after.png'});
  await mobile.goto('http://127.0.0.1:8086/department/wedding');await expect(mobile.getByRole('img',{name:'Published Wedding visual check',exact:true}).first()).toBeVisible({timeout:60000});
  const current=await(await fetch(path,{headers})).json(),stale=await fetch(path,{method:'PATCH',headers,body:JSON.stringify({visualAction:'publish',expectedVisualRevision:0})});assert.equal(stale.status,400);
  const support=await(await fetch('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=demo-aarvika-local-key',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'support@aarvika.invalid',password:'Local-demo-only-2026!',returnSecureToken:true})})).json();assert.equal((await fetch(path,{method:'PATCH',headers:{...headers,Authorization:'Bearer '+support.idToken},body:JSON.stringify({visualAction:'draft',visual:{title:'Denied'},expectedVisualRevision:current.visualRevision})})).status,403);
  await admin.getByRole('combobox',{name:'Visual rollback version',exact:true}).selectOption(String(original.visualVersion??0));await admin.getByRole('button',{name:'Rollback visual',exact:true}).click();await expect.poll(async()=>JSON.stringify((await snapshot()).categories.find(c=>c.id===category.id).visual)).toBe(JSON.stringify(original.visualPublished??{}));
  const home=(await(await fetch(base+'/api/admin/homepage',{headers})).json()).sections.find(s=>s.id==='commerce-wedding-products'),publishedVersion=(await(await fetch(base+'/api/admin/homepage/versions',{headers})).json()).version;
  restoreHomeVersion=publishedVersion;
  const write=await fetch(base+'/api/admin/homepage/'+home.id,{method:'PATCH',headers,body:JSON.stringify({...home,title:'Demo edited wedding row',sortOrder:1.5,expectedVersion:publishedVersion})});assert.equal(write.status,200);
  assert.equal((await snapshot()).commercePages.find(p=>p.key==='department:wedding').sections.some(s=>s.title==='Demo edited wedding row'),false);
  assert.equal((await fetch(base+'/api/admin/homepage/'+home.id,{method:'PATCH',headers,body:JSON.stringify({action:'publish',expectedVersion:publishedVersion})})).status,200);
  await expect(mobile.getByRole('heading',{name:'Demo edited wedding row',exact:true})).toBeVisible({timeout:15000});
  const updated=(await snapshot()).commercePages.find(p=>p.key==='department:wedding').sections;assert.equal(updated.find(s=>s.id===home.id).order,1.5);
  const latestVersion=(await(await fetch(base+'/api/admin/homepage/versions',{headers})).json()).version;
  assert.equal((await fetch(base+'/api/admin/homepage/versions',{method:'POST',headers,body:JSON.stringify({action:'rollback',version:publishedVersion,expectedVersion:latestVersion})})).status,200);
  assert.equal((await snapshot()).commercePages.find(p=>p.key==='department:wedding').sections.find(s=>s.id===home.id).title,home.title);
  restoreHomeVersion=undefined;
  await admin.goto(base+'/admin/homepage');await admin.getByRole('combobox',{name:'Editing mobile page',exact:true}).selectOption('department:wedding');await expect(admin.locator('article')).toHaveCount(initial.commercePages.find(p=>p.key==='department:wedding').sections.length);
  await mobile.goto('http://127.0.0.1:8086/department/furniture');await mobile.getByRole('button',{name:'Start an inquiry',exact:true}).click();await mobile.waitForURL('**/furniture/inquiry');
  assert.deepEqual(errors,[]);console.log('PASS: category GUI draft/preview/publish/rollback, connected mobile image refresh, private drafts, stale revision and SUPPORT denial; page section edit/order/publish/rollback and open-screen refresh. Demo project only; original visual/homepage content restored.');
 }finally{
  if(restoreHomeVersion!==undefined){const version=(await(await fetch(base+'/api/admin/homepage/versions',{headers})).json()).version;await fetch(base+'/api/admin/homepage/versions',{method:'POST',headers,body:JSON.stringify({action:'rollback',version:restoreHomeVersion,expectedVersion:version})});}
  if(changed){const latest=await(await fetch(path,{headers})).json();if(JSON.stringify(latest.visualPublished??{})!==JSON.stringify(original.visualPublished??{})){await fetch(path,{method:'PATCH',headers,body:JSON.stringify({visualAction:'draft',visual:original.visualPublished??{},expectedVisualRevision:latest.visualRevision})});const d=await(await fetch(path,{headers})).json();await fetch(path,{method:'PATCH',headers,body:JSON.stringify({visualAction:'publish',expectedVisualRevision:d.visualRevision})});}}
  await browser.close();
 }
})().catch(e=>{console.error(e.message);process.exitCode=1;});
