import test from 'node:test';
import assert from 'node:assert/strict';
import {createAdminEmulatorAdapter,validateAdminEmulatorBaseUrl} from '../../../packages/catalogue/src/admin-emulator-adapter.ts';
import {adminEmulatorMeta,validateMeta,validateAdminEmulatorMeta} from '../../../packages/catalogue/src/api-contracts.ts';
import {demoSnapshot} from '../../../packages/catalogue/src/fixture-adapter.ts';
import {resolveEnvironment} from '../src/config/environment.ts';
const data=()=>({...demoSnapshot(),meta:adminEmulatorMeta});
test('admin emulator is opt-in, exact numeric loopback, demo project only; v1 guards remain strict',()=>{
 assert.equal(resolveEnvironment({}).dataMode,'fixture');
 assert.equal(resolveEnvironment({dataMode:'admin-emulator'}).apiBaseUrl,'http://127.0.0.1:3100');
 assert.throws(()=>resolveEnvironment({dataMode:'admin-emulator',appEnv:'production'}));
 for(const url of ['https://127.0.0.1:3100','http://localhost:3100','http://127.0.0.1:3001','http://127.0.0.1:3100/path','http://example.invalid:3100'])assert.throws(()=>validateAdminEmulatorBaseUrl(url));
 assert.throws(()=>validateMeta(adminEmulatorMeta));
 assert.throws(()=>validateAdminEmulatorMeta({...adminEmulatorMeta,projectId:'gift4u-4210f'}));
});
test('fresh canonical snapshots support edits, removal, combined filters and bounded reads',async()=>{
 let snapshot=data(),calls=0;
 const adapter=createAdminEmulatorAdapter(undefined,{fetcher:async(url,init)=>{
  assert.equal(String(url),'http://127.0.0.1:3100/api/mobile/v2/catalog');assert.equal(init?.redirect,'error');assert.equal(init?.credentials,'omit');calls++;
  return new Response(JSON.stringify({meta:adminEmulatorMeta,data:snapshot}),{headers:{'Content-Type':'application/json'}});
 }});
 const [a,b]=await Promise.all([adapter.bootstrap(),adapter.bootstrap()]);assert.equal(calls,1);assert.equal(a,b);
 const id=snapshot.products[0].id;snapshot.products[0].title='Demo edited title';assert.equal((await adapter.getProduct(id))?.title,'Demo edited title');
 const result=await adapter.search({departmentId:'clothing',attributes:{Size:'M',Colour:'Blue'},inStockOnly:true,limit:2});assert.ok(result.products.length<=2);assert.ok(result.total>0);
 // Remove a complete unrelated product, preserving canonical ownership validation.
 const removed=snapshot.products.find(p=>p.purchaseMode==='inquiry')!;snapshot={...snapshot,products:snapshot.products.filter(p=>p.id!==removed.id),skus:snapshot.skus.filter(s=>s.productId!==removed.id),collections:snapshot.collections.map(c=>({...c,productIds:c.productIds.filter(id=>id!==removed.id)}))};
 assert.equal(await adapter.getProduct(removed.id),null);
});
test('admin transport rejects unsafe metadata/media and supports timeouts, failures and retry',async()=>{
 const invalid=data();invalid.products[0].media=[{path:'https://invalid.example/image.png',alt:'Unsafe'}];
 const malformed=createAdminEmulatorAdapter(undefined,{fetcher:async()=>new Response(JSON.stringify({meta:adminEmulatorMeta,data:invalid}),{headers:{'Content-Type':'application/json'}})});
 await assert.rejects(malformed.bootstrap(),/inconsistent/);
 const timeout=createAdminEmulatorAdapter(undefined,{timeoutMs:10,fetcher:()=>new Promise(()=>{})});await assert.rejects(timeout.bootstrap(),/timed out/);
 const good=createAdminEmulatorAdapter(undefined,{fetcher:async()=>new Response(JSON.stringify({meta:adminEmulatorMeta,data:data()}),{headers:{'Content-Type':'application/json'}})});
 good.setNetworkMode('failure');await assert.rejects(good.bootstrap(),/unavailable/);good.setNetworkMode('normal');assert.equal((await good.bootstrap()).meta.contractVersion,2);
});
