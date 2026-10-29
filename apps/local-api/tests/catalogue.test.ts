import test from 'node:test';
import assert from 'node:assert/strict';
import { get, createServer } from 'node:http';
import { startLocalServer, assertIsolatedEnvironment } from '../src/server.ts';
import { createFixtureAdapter, demoSnapshot } from '../../../packages/catalogue/src/fixture-adapter.ts';
import { createLocalApiAdapter, createStagingAdapter } from '../../../packages/catalogue/src/http-adapter.ts';
import { CatalogueError, localMeta, validateLocalBaseUrl } from '../../../packages/catalogue/src/api-contracts.ts';
import { validateSnapshot } from '../../../packages/catalogue/src/validation.ts';
import { validateSearch } from '../../../packages/catalogue/src/reader.ts';
import type { SearchQuery } from '../../../packages/catalogue/src/contracts.ts';

async function withApi(run:(base:string)=>Promise<void>){const server=await startLocalServer(0,{});const address=server.address();assert.ok(address&&typeof address==='object');try{await run(`http://127.0.0.1:${address.port}`);}finally{await new Promise<void>((resolve,reject)=>server.close(e=>e?reject(e):resolve()));}}
test('local API and fixture adapters preserve all departments, canonical records and specialized combined filters',async()=>{
  await withApi(async base=>{
    const requests:string[]=[];const api=createLocalApiAdapter(base,{fetcher:async(input,init)=>{requests.push(String(input));assert.equal(new URL(String(input)).hostname,'127.0.0.1');return fetch(input,init);}}),fixture=createFixtureAdapter();
    const data=await api.bootstrap();assert.deepEqual(data,await fixture.bootstrap());assert.equal(data.departments.length,8);assert.equal(new Set(data.products.map(p=>p.id)).size,data.products.length);assert.equal(new Set(data.skus.map(s=>s.id)).size,data.skus.length);assert.ok(data.products.every(p=>p.demo));assert.ok(data.skus.every(s=>s.inventory.demo));
    const queries:SearchQuery[]=[...data.departments.map(d=>({departmentId:d.id,limit:3})),{departmentId:'birthday',age:47,recipient:'Her',interest:'Coffee',personalizedOnly:true,maxPrice:44900},{departmentId:'anniversary',year:37,recipient:'Couple',maxPrice:100000},{departmentId:'clothing',attributes:{Audience:'Women',Size:'M',Colour:'Blue'},inStockOnly:true},{departmentId:'stationery',attributes:{'Paper size':'A5',GSM:'100'}},{departmentId:'furniture',attributes:{Sector:'Commercial'},maxWidth:130,includeUnpriced:true},{departmentId:'hampers',bundleOnly:true,maxPrice:150000},{categoryId:'personalized-8-1'},{text:'Sakharpuda'},{text:'zzzz-no-result'},{collectionId:'thoughtful',sort:'price-desc',limit:2,cursor:'2'}];
    for(const q of queries)assert.deepEqual(await api.search(q),await fixture.search(q),JSON.stringify(q));
    assert.deepEqual(await api.departments(),await fixture.departments());assert.deepEqual(await api.categories({departmentId:'stationery',level:2}),await fixture.categories({departmentId:'stationery',level:2}));assert.deepEqual(await api.categories({parentId:'stationery-2'}),await fixture.categories({parentId:'stationery-2'}));
    assert.deepEqual(await api.layout(),await fixture.layout());assert.deepEqual(await api.collections(),await fixture.collections());assert.deepEqual(await api.suggestions('Marathi'),await fixture.suggestions('Marathi'));
    assert.deepEqual(await api.getProduct('cotton-kurta'),await fixture.getProduct('cotton-kurta'));assert.deepEqual(await api.variants('cotton-kurta'),await fixture.variants('cotton-kurta'));assert.deepEqual(await api.getSku('cotton-kurta-large'),await fixture.getSku('cotton-kurta-large'));assert.equal(await api.getProduct('missing'),null);assert.equal(await api.getSku('missing'),null);assert.deepEqual(await api.variants('missing'),[]);
    let cursor:string|undefined;const ids:string[]=[];do{const result=await api.search({limit:7,cursor});ids.push(...result.products.map(p=>p.id));cursor=result.nextCursor;}while(cursor);assert.equal(ids.length,data.products.length);assert.equal(new Set(ids).size,ids.length);assert.ok(requests.length>20);
  });
});
test('HTTP boundary is read-only, refuses remote origins/hosts and bounds malformed filters',async()=>withApi(async base=>{
  for(const route of ['/health','/v1/meta']){const r=await fetch(base+route);assert.equal(r.status,200);assert.deepEqual((await r.json()).data,localMeta);}
  const listing=await fetch(base+'/v1/catalog/products?q='+encodeURIComponent('{"limit":2}'));assert.equal(listing.status,200);assert.equal((await listing.json()).data.products.length,2);
  assert.equal((await fetch(base+'/v1/orders',{method:'POST',body:'{}'})).status,405);assert.equal((await fetch(base+'/v1/catalog/products',{method:'DELETE'})).status,405);assert.equal((await fetch(base+'/v1/payments')).status,404);
  assert.equal((await fetch(base+'/v1/meta',{headers:{Origin:'https://example.com'}})).status,403);
  const badHost=await new Promise<number|undefined>((resolve,reject)=>get(base+'/v1/meta',{headers:{Host:'attacker.example'}},res=>{res.resume();resolve(res.statusCode);}).on('error',reject));assert.equal(badHost,403);
  const allowed=await fetch(base+'/v1/meta',{headers:{Origin:'http://localhost:8082'}});assert.equal(allowed.headers.get('access-control-allow-origin'),'http://localhost:8082');
  for(const query of ['{','null','[]','{"limit":101}','{"limit":0}','{"cursor":"bad"}','{"attributes":{"__proto__":"x"}}','{"unknown":"x"}','{"maxPrice":null}'])assert.equal((await fetch(base+'/v1/catalog/search?q='+encodeURIComponent(query))).status,400,query);
  assert.equal((await fetch(base+'/v1/catalog/categories?level=9')).status,400);
}));
test('configuration and staging extension fail closed without Firebase or payment clients',()=>{
  for(const key of ['GOOGLE_APPLICATION_CREDENTIALS','GOOGLE_CLOUD_PROJECT','GCLOUD_PROJECT','FIREBASE_CONFIG','FIREBASE_PROJECT_ID','FIREBASE_TOKEN','FIRESTORE_EMULATOR_HOST','FIREBASE_AUTH_EMULATOR_HOST','FIREBASE_STORAGE_EMULATOR_HOST','RAZORPAY_KEY_ID'])assert.throws(()=>assertIsolatedEnvironment({[key]:'gift4u-4210f'}));
  assert.throws(()=>assertIsolatedEnvironment({LOCAL_API_HOST:'0.0.0.0'}));assert.doesNotThrow(()=>assertIsolatedEnvironment({}));assert.throws(createStagingAdapter,/disabled/);
  for(const url of ['https://gift4u-4210f.firebaseapp.com','http://example.com:3001','http://localhost:3001','http://192.168.1.5:3001','http://user:pass@127.0.0.1:3001','http://127.0.0.1:3001/path','http://127.0.0.1:3001?project=gift4u-4210f'])assert.throws(()=>validateLocalBaseUrl(url));
  assert.equal(validateLocalBaseUrl('http://127.0.0.1:3001'),'http://127.0.0.1:3001');
});
test('client handles server errors, unreachable API, timeout, empty/malformed payload and unsafe metadata without fixture fallback',async()=>{
  const errorCode=(code:string)=>(e:unknown)=>e instanceof CatalogueError&&e.code===code;
  for(const [body,status,code] of [[JSON.stringify({error:{message:'no'}}),503,'HTTP_503'],['',200,'INVALID_RESPONSE'],[JSON.stringify({meta:localMeta,data:{}}),200,'INVALID_RESPONSE'],[JSON.stringify({meta:{...localMeta,firebaseEnabled:true},data:demoSnapshot()}),200,'UNSAFE_SOURCE']] as const){const api=createLocalApiAdapter('http://127.0.0.1:3001',{fetcher:async()=>new Response(body,{status,headers:{'content-type':'application/json'}})});await assert.rejects(api.bootstrap(),errorCode(code));}
  const timeout=createLocalApiAdapter('http://127.0.0.1:3001',{timeoutMs:20,fetcher:()=>new Promise(()=>{})});await assert.rejects(timeout.bootstrap(),errorCode('TIMEOUT'));
  const offline=createLocalApiAdapter('http://127.0.0.1:3001',{fetcher:async()=>{throw new Error('offline');}});await assert.rejects(offline.bootstrap(),errorCode('NETWORK_ERROR'));
  await withApi(async base=>{const api=createLocalApiAdapter(base);await api.bootstrap();const none=await api.search({text:'no-such-demo-product-ever'});assert.deepEqual(none.products,[]);assert.equal(none.total,0);});
});
test('malformed product and search responses are rejected before rendering, rather than mixed with fixtures',async()=>{
  const api=createLocalApiAdapter('http://127.0.0.1:3001',{fetcher:async input=>{const path=new URL(String(input)).pathname;const data=path.endsWith('bootstrap')?demoSnapshot():path.endsWith('name-mug')?{id:'name-mug'}:{products:[{id:'name-mug'}],total:1};return new Response(JSON.stringify({meta:localMeta,data}),{headers:{'content-type':'application/json'}});}});
  await api.bootstrap();await assert.rejects(api.getProduct('name-mug'));await assert.rejects(api.search({text:'mug'}));
});
test('snapshot validation rejects duplicate identities, foreign SKU, missing taxonomy and non-demo data',()=>{
  for(const mutate of [(d:ReturnType<typeof demoSnapshot>)=>d.products.push(d.products[0]),(d:ReturnType<typeof demoSnapshot>)=>{d.skus[0].inventory.skuId='other';},(d:ReturnType<typeof demoSnapshot>)=>{d.categories[1].parentId='missing';},(d:ReturnType<typeof demoSnapshot>)=>{d.skus[0].inventory.demo=false;},(d:ReturnType<typeof demoSnapshot>)=>{d.layout.sections[0].action='https://example.com';}]){const d=demoSnapshot();mutate(d);assert.throws(()=>validateSnapshot(d));}
  assert.throws(()=>validateSearch({attributes:new Array(100)}));assert.throws(()=>validateSearch({minPrice:Infinity}));
});
test('real loopback HTTP timeout aborts and the same adapter recovers on retry',async()=>{
  const body=JSON.stringify({meta:localMeta,data:demoSnapshot()});let first=true;const timers:ReturnType<typeof setTimeout>[]=[];
  const server=createServer((_req,res)=>{const delay=first?350:0;first=false;timers.push(setTimeout(()=>{res.setHeader('content-type','application/json');res.end(body);},delay));});
  await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));const address=server.address();assert.ok(address&&typeof address==='object');
  try{const api=createLocalApiAdapter(`http://127.0.0.1:${address.port}`,{timeoutMs:100});await assert.rejects(api.bootstrap(),(e:unknown)=>e instanceof CatalogueError&&e.code==='TIMEOUT');assert.equal((await api.bootstrap()).products.length,294);}
  finally{timers.forEach(clearTimeout);server.closeAllConnections();await new Promise<void>(resolve=>server.close(()=>resolve()));}
});
