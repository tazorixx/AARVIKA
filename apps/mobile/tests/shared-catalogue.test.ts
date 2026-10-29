import test from 'node:test';
import assert from 'node:assert/strict';
import {createSharedApiAdapter,validateSharedApiBaseUrl} from '../../../packages/catalogue/src/shared-api-adapter.ts';
import {sharedCatalogueMeta} from '../../../packages/catalogue/src/api-contracts.ts';
import {demoSnapshot} from '../../../packages/catalogue/src/fixture-adapter.ts';

test('shared catalogue accepts only the selected source and published-style records', async () => {
  const fixture=demoSnapshot();
  const data={...fixture,meta:sharedCatalogueMeta,products:fixture.products.map(product=>({...product,demo:false})),skus:fixture.skus.map(sku=>({...sku,inventory:{...sku.inventory,demo:false}}))};
  const fetcher=(async () => new Response(JSON.stringify({meta:sharedCatalogueMeta,data}),{status:200,headers:{'content-type':'application/json'}})) as typeof fetch;
  const adapter=createSharedApiAdapter('http://127.0.0.1:3100','development',{fetcher});
  assert.deepEqual((await adapter.bootstrap()).meta,sharedCatalogueMeta);
  const wrong=(async () => new Response(JSON.stringify({meta:fixture.meta,data:fixture}),{status:200,headers:{'content-type':'application/json'}})) as typeof fetch;
  await assert.rejects(createSharedApiAdapter('http://127.0.0.1:3100','development',{fetcher:wrong}).bootstrap(),/approved shared project/);
});

test('shared API permits HTTPS and development loopback only', () => {
  assert.equal(validateSharedApiBaseUrl('https://store.example','production'),'https://store.example');
  assert.throws(()=>validateSharedApiBaseUrl('http://127.0.0.1:3100','production'));
  assert.throws(()=>validateSharedApiBaseUrl('http://localhost:3100','development'));
  assert.throws(()=>validateSharedApiBaseUrl('https://store.example/path','production'));
});
