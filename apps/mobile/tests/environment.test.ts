import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveEnvironment } from '../src/config/environment.ts';
test('environment defaults and explicit configuration keep fixture mode without live services', () => { assert.equal(resolveEnvironment({}).dataMode, 'fixture'); assert.deepEqual(resolveEnvironment({ appEnv: 'development', dataMode: 'fixture', apiBaseUrl: 'http://localhost:3001' }), { appEnv: 'development', dataMode: 'fixture', apiBaseUrlConfigured: true, liveServicesEnabled: false }); });
test('nonfixture mode fails closed instead of contacting an API or Firebase', () => { assert.throws(() => resolveEnvironment({ dataMode: 'firebase' })); assert.throws(() => resolveEnvironment({ dataMode: 'api' })); assert.throws(() => resolveEnvironment({ appEnv: 'unknown' })); });
test('published build requires real catalogue and resolves its own HTTPS origin',()=>{
 assert.throws(()=>resolveEnvironment({appEnv:'production',dataMode:'fixture'}));
 const config=resolveEnvironment({appEnv:'production',dataMode:'shared-api',apiBaseUrl:'same-origin',browserOrigin:'https://aarvika.example'});
 assert.equal(config.apiBaseUrl,'https://aarvika.example');
 assert.equal(config.liveServicesEnabled,true);
 assert.throws(()=>resolveEnvironment({appEnv:'production',dataMode:'shared-api',apiBaseUrl:'same-origin',browserOrigin:'http://127.0.0.1:8086'}));
});
