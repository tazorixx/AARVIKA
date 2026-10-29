import test from 'node:test';
import assert from 'node:assert/strict';
import {publishedDepartmentPresentation} from '../../../packages/catalogue/src/published-presentation.ts';
test('all eight live departments retain approved images without sample products',()=>{
 for(const id of ['wedding','birthday','personalized','anniversary','hampers','clothing','stationery','furniture'] as const){
  const sections=publishedDepartmentPresentation(id,false);
  assert.ok(sections.find(s=>s.type==='hero')?.mobileImagePath?.startsWith('https://ik.imagekit.io/'));
  assert.ok(sections.find(s=>s.dataSourceRef==='@families'));
  assert.ok(sections.every(s=>!s.productIds?.length));
 }
});
