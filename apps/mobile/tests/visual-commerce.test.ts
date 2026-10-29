import {test} from 'node:test';
import assert from 'node:assert/strict';
import {demoSnapshot} from '../../../packages/catalogue/src/fixture-adapter.ts';
import {defaultCommerceSections,parseVisualMedia,validPageKey} from '../../../packages/catalogue/src/visual-commerce.ts';
import {validateSnapshot} from '../../../packages/catalogue/src/validation.ts';
import {discoveryQuery} from '../src/domain/discovery-query.ts';
test('all eight compositions lead with discovery and products before category grids',()=>{
 const data=demoSnapshot();assert.equal(data.commercePages?.length,8);
 for(const d of data.departments){const sections=defaultCommerceSections(d.id);assert.equal(sections[0].type,'hero');assert.ok(sections.find(s=>s.type==='products')!.order<sections.find(s=>s.dataSourceRef==='@families')!.order);assert.ok(sections.every(s=>s.action.startsWith('/')));assert.equal(new Set(sections.map(s=>s.id)).size,sections.length);}
 validateSnapshot(data);
});
test('the exact source families and canonical product/SKU authority survive visual metadata',()=>{
 const data=demoSnapshot();for(const [id,count] of [['personalized',9],['hampers',10],['stationery',11]] as const)assert.equal(data.categories.filter(c=>c.departmentId===id&&c.level===2).length,count);
 assert.equal(new Set(data.products.map(p=>p.id)).size,data.products.length);assert.equal(new Set(data.skus.map(s=>s.id)).size,data.skus.length);assert.ok(data.categories.every(c=>c.visual));
});
test('media publishing whitelists presentation fields and rejects unsafe media and page targets',()=>{
 assert.throws(()=>parseVisualMedia({imagePath:'https://example.invalid/image.jpg',imageAlt:'Example'}));assert.throws(()=>parseVisualMedia({imagePath:'/demo-art/mug.png'}));
 assert.deepEqual(parseVisualMedia({title:' Sample ',imagePath:'/demo-art/mug.png',imageAlt:'Demo mug',privateKey:'never'}),{title:'Sample',imagePath:'/demo-art/mug.png',imageAlt:'Demo mug'});
 for(const key of ['home','department:wedding','function:sakharpuda','shortcut:birthday:recipient-her'])assert.equal(validPageKey(key),true);
 for(const key of ['department:lifestyle','https://evil.invalid','category:../bad'])assert.equal(validPageKey(key),false);
});
test('visual deep links retain combined department, category, milestone and SKU attribute filters',()=>{
 assert.deepEqual(discoveryQuery({departmentId:'clothing',categoryId:'clothing-1',attributeKey:'Size',attributeValue:'M',maxPrice:'99900'}),{categoryId:'clothing-1',departmentId:'clothing',maxPrice:99900,attributes:{Size:'M'}});
 assert.deepEqual(discoveryQuery({departmentId:'birthday',recipient:'Her',age:'30',interest:'Books'}),{recipient:'Her',interest:'Books',departmentId:'birthday',age:30});
 assert.deepEqual(discoveryQuery({departmentId:'lifestyle',age:'NaN',year:'-3'}),{});
});
test('optional page composition validates media and rejects unsafe navigation',()=>{
 const data=demoSnapshot();data.commercePages![0].sections[0].action='https://evil.invalid';assert.throws(()=>validateSnapshot(data));
});
