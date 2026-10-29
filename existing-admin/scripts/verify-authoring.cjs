/* eslint-disable @typescript-eslint/no-require-imports -- Guarded local integration runner. */
const assert = require('node:assert/strict');
const { isolatedEnv } = require('./isolated-env.cjs');
Object.assign(process.env, isolatedEnv());
const { getAdminDb } = require('../src/lib/firebase-admin.ts');
const { blankAuthoring } = require('../../packages/catalogue/src/admin-contracts.ts');
const base = 'http://127.0.0.1:3100';
let checks = 0;
async function signIn(email) {
  const r = await fetch('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=demo-aarvika-local-key', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password:'Local-demo-only-2026!',returnSecureToken:true})});
  assert.equal(r.status,200); return (await r.json()).idToken;
}
(async()=>{
  const token=await signIn('owner@aarvika.invalid'), support=await signIn('support@aarvika.invalid');
  async function api(path,method='GET',body,expected=200,credential=token){
    const r=await fetch(base+path,{method,headers:{Authorization:'Bearer '+credential,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});
    const data=await r.json();assert.equal(r.status,expected,`${method} ${path}: ${JSON.stringify(data)}`);checks++;return data;
  }
  const stamp=Date.now(), code=`QA-${stamp}`;
  const input={title:'Demo authoring QA '+stamp,sku:code,price:199.95,mrp:0,status:'live',categoryIds:['stationery-root'],images:[{url:'/file.svg'}],inventory:{quantity:8},aarvika:{...blankAuthoring(),departmentIds:['stationery'],canonicalCategoryId:'stationery-root',productType:'paper'}};
  await api('/api/admin/products','POST',{...input,inventory:{quantity:-1}},400);
  const created=await api('/api/admin/products','POST',input,201);
  let product=await api('/api/admin/products/'+created.id);
  assert.equal(product.aarvika.revision,1);assert.equal(product.aarvikaSkuIds.length,1);
  const db=getAdminDb(), skuId=product.aarvikaSkuIds[0];
  let sku=(await db.collection('skus').doc(skuId).get()).data();assert.equal(sku.pricePaise,19995);
  await api('/api/admin/products','POST',{...input,slug:'duplicate-'+stamp},400);
  await api('/api/admin/products/'+created.id,'PATCH',{...product,title:'Demo updated '+stamp});
  await api('/api/admin/products/'+created.id,'PATCH',product,400);
  product=await api('/api/admin/products/'+created.id);
  await db.collection('skus').doc(skuId).update({reserved:2,sold:3});
  sku=(await db.collection('skus').doc(skuId).get()).data();
  await api('/api/admin/inventory/'+created.id,'PATCH',{quantity:1,skuId,revision:sku.revision,reason:'QA below reserved'},400);
  await api('/api/admin/inventory/'+created.id,'PATCH',{quantity:12,skuId,revision:sku.revision,reason:'Local QA replenishment',reserved:0,sold:0});
  const adjusted=(await db.collection('skus').doc(skuId).get()).data();assert.equal(adjusted.reserved,2);assert.equal(adjusted.sold,3);assert.equal(adjusted.quantity,12);
  await api('/api/admin/inventory/'+created.id,'PATCH',{quantity:13,skuId,revision:sku.revision,reason:'Stale'},400);
  await api('/api/admin/inventory/'+created.id,'PATCH',{quantity:13,skuId,revision:adjusted.revision,reason:'Role denial'},403,support);
  await api('/api/admin/categories/stationery-root','DELETE',undefined,400);
  await api('/api/admin/categories','POST',{name:'Bad cross department',slug:'bad-'+stamp,parentId:'stationery-root',departmentId:'clothing'},400);
  await api('/api/admin/bulk','POST',{entity:'inventory',ids:[created.id],quantity:99},400);
  await api('/api/admin/bulk','POST',{entity:'products',ids:[created.id],action:'draft'});
  product=await api('/api/admin/products/'+created.id);assert.equal(product.status,'draft');
  await api('/api/admin/bulk','POST',{entity:'products',ids:[created.id],action:'publish'});
  await api('/api/admin/bulk','POST',{entity:'products',ids:[created.id],action:'archive'});
  product=await api('/api/admin/products/'+created.id);assert.equal(product.status,'archived');
  await api('/api/admin/bulk','POST',{entity:'products',ids:[created.id],action:'publish'});
  for(const department of ['wedding','birthday','personalized','anniversary','hampers','clothing','stationery','furniture']){
    const configuration={...blankAuthoring(),departmentIds:[department],canonicalCategoryId:department+'-root',productType:department==='furniture'?'furniture':'gift'};
    if(department==='wedding'||department==='hampers')configuration.bundle={components:[{skuId,quantity:2}],packagingFeePaise:500,minItems:2,maxItems:4,capacity:6,allowedProductTypes:['paper']};
    if(department==='birthday')configuration.discovery={ageMin:8,ageMax:18,interests:['Books','Art']};
    if(department==='anniversary')configuration.discovery={yearMin:10,yearMax:25};
    if(department==='personalized')configuration.personalization={fields:[{key:'engraving',label:'Engraving',kind:'text',required:true,maxLength:40},{key:'photo',label:'Photo',kind:'photo',required:false}],photoMaxBytes:5242880,photoMimeTypes:['image/jpeg']};
    if(department==='clothing')configuration.sizeGuide={unit:'cm',rows:[{size:'M',chest:96,length:68}],instructions:'Demo garment measurement'};
    if(department==='furniture'){configuration.purchaseMode='inquiry';configuration.specs={Sector:'Commercial',Width:'120',Depth:'60',Height:'75',Unit:'cm',Finish:'Matte'};}
    const payload={...input,title:'Demo '+department+' '+stamp,slug:'demo-'+department+'-'+stamp,sku:code+'-'+department,categoryIds:[department+'-root'],aarvika:configuration};
    if(department==='clothing')payload.variants=[{id:'purple-m',name:'Size',value:'M',sku:code+'-M',quantity:4,price:399.95,attributes:{Size:'M',Colour:'Purple',Fit:'Regular',Fabric:'Cotton'}},{id:'purple-l',name:'Size',value:'L',sku:code+'-L',quantity:0,price:449.95,attributes:{Size:'L',Colour:'Purple',Fit:'Regular',Fabric:'Cotton'}}];
    const made=await api('/api/admin/products','POST',payload,201);
    const saved=await api('/api/admin/products/'+made.id);
    assert.deepEqual(saved.aarvika.departmentIds,[department]);
    if(department==='furniture')assert.deepEqual(saved.aarvikaSkuIds,[]);
    if(department==='clothing'){
      assert.equal(saved.aarvikaSkuIds.length,2);
      await db.collection('skus').doc(saved.aarvikaSkuIds[0]).update({reserved:1,sold:2});
      await api('/api/admin/products/'+made.id,'PATCH',{...saved,variants:saved.variants.map((v,i)=>i===0?{...v,attributes:{...v.attributes,Size:'XXL'}}:v)},400);
    }
    if(configuration.bundle){assert.deepEqual(saved.aarvikaSkuIds,[]);assert.equal(saved.price,404.9);assert.equal(saved.inventory.quantity,0);}
  }
  await api('/api/admin/products','POST',{...input,slug:'duplicate-parent-'+stamp,variants:[{id:'other',name:'Size',value:'S',sku:'NEW-'+stamp,quantity:1,price:100,attributes:{Size:'S'}}]},400);
  const concurrent=await Promise.all(['A','B'].map(letter=>fetch(base+'/api/admin/products',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({...input,title:'Demo concurrent '+letter+' '+stamp,slug:'concurrent-'+letter.toLowerCase()+'-'+stamp,sku:'CONCURRENT-'+stamp,variants:[{id:letter,name:'Size',value:letter,sku:'CONCURRENT-'+letter+'-'+stamp,quantity:1,price:100,attributes:{Size:letter}}]})})));
  assert.deepEqual(concurrent.map(r=>r.status).sort(),[201,400]);checks++;
  console.log(`${checks} authoring HTTP checks passed; eight departments, canonical paise, immutable SKUs, variant stock, inquiry-only furniture, specialization round trips, revision conflicts, duplicate codes, reserved/sold history, hierarchy, publication and role denial verified. Demo emulator only.`);
})().catch(error=>{console.error(error.message);process.exitCode=1;});
