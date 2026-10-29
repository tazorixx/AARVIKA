import test from 'node:test';
import assert from 'node:assert/strict';
import {catalogueHeaders} from '../src/lib/catalog/public-origin';
test('hosted catalogue accepts same origin and explicitly allowed HTTPS origins only',()=>{
 const request=(origin:string)=>new Request('https://aarvika.example/api/mobile/v2/catalog',{headers:{Origin:origin}});
 assert.equal(catalogueHeaders(request('https://aarvika.example'),{NODE_ENV:'production'})['Access-Control-Allow-Origin'],'https://aarvika.example');
 assert.throws(()=>catalogueHeaders(request('https://unrelated.example'),{NODE_ENV:'production'}));
 assert.throws(()=>catalogueHeaders(request('http://127.0.0.1:8086'),{NODE_ENV:'production'}));
 assert.doesNotThrow(()=>catalogueHeaders(request('https://mobile.example'),{NODE_ENV:'production',AARVIKA_STOREFRONT_ORIGINS:'https://mobile.example'}));
 assert.doesNotThrow(()=>catalogueHeaders(request('http://127.0.0.1:8086'),{NODE_ENV:'development'}));
});
