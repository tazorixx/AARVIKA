import test from 'node:test';
import assert from 'node:assert/strict';
import { createCatalogueAdapter } from '../src/services/adapters.ts';
import { resolveEnvironment } from '../src/config/environment.ts';
test('fixture remains default; only explicit loopback local API opt-in is allowed',async()=>{
  const fixture=createCatalogueAdapter(resolveEnvironment({}));assert.equal(fixture.mode,'fixture');assert.equal((await fixture.bootstrap()).departments.length,8);
  assert.equal(createCatalogueAdapter(resolveEnvironment({dataMode:'local-api',apiBaseUrl:'http://127.0.0.1:3001'})).mode,'local-api');
  assert.throws(()=>resolveEnvironment({dataMode:'local-api',appEnv:'production'}));assert.throws(()=>resolveEnvironment({dataMode:'local-api',apiBaseUrl:'http://192.168.1.1:3001'}));assert.throws(()=>createCatalogueAdapter({dataMode:'staging'}));
});
