import test from 'node:test';
import assert from 'node:assert/strict';
import { blankAuthoring, parseAuthoring,parseInquiryUpdate, rupeesToPaise, validateAuthoring, validateCategoryPlacement, validateVariants, type AuthoringCategory } from '@aarvika/catalogue/admin-contracts';
import { parseProductInput } from '../src/lib/catalog/validation';

test('rupees convert to integer paise once, including decimal prices; invalid precision is rejected', () => {
  assert.equal(rupeesToPaise(199.95),19995);
  assert.equal(rupeesToPaise(0.1+0.2),30);
  for (const n of [NaN,Infinity,-1,0.001]) assert.throws(()=>rupeesToPaise(n));
});
test('SKU codes and attribute combinations must be unique regardless of case or field order', () => {
  const a={name:'Size',value:'M',sku:'SKU-M',quantity:2,price:100,attributes:{Size:'M',Colour:'Purple'}};
  assert.doesNotThrow(()=>validateVariants([a,{...a,sku:'SKU-L',attributes:{Size:'L',Colour:'Purple'}}]));
  assert.throws(()=>validateVariants([a,{...a,sku:'other',attributes:{colour:'purple',size:'m'}}]),/combination/);
  assert.throws(()=>validateVariants([a,{...a,sku:'sku-m',attributes:{Size:'L'}}]),/SKU code/);
  assert.throws(()=>validateVariants([{...a,quantity:1.5}]),/whole number/);
});
test('three-level categories prevent cycles, cross-department parents and moving a subtree too deep', () => {
  const rows:AuthoringCategory[]=[{id:'root',name:'Clothing',parentId:null,active:true,departmentId:'clothing',level:1},{id:'sub',name:'Men',parentId:'root',active:true,departmentId:'clothing',level:2},{id:'child',name:'Shirts',parentId:'sub',active:true,departmentId:'clothing',level:3}];
  assert.equal(validateCategoryPlacement(rows,rows[2]).level,3);
  assert.throws(()=>validateCategoryPlacement(rows,{...rows[0],parentId:'child'}),/cycle/);
  assert.throws(()=>validateCategoryPlacement(rows,{...rows[1],departmentId:'stationery'}),/same department/);
  assert.throws(()=>validateCategoryPlacement(rows,{...rows[2],id:'fourth',parentId:'child'}),/Main/);
  assert.throws(()=>validateCategoryPlacement(rows,{...rows[0],id:'second-root'}),/already/);
});
test('authoring preserves specialist fields and rejects a ninth department and invalid ranges', () => {
  const value={...blankAuthoring(),departmentIds:['birthday'],discovery:{ageMin:18,ageMax:65,interests:['Books']},specs:{Paper:'120 gsm'}};
  assert.deepEqual(parseAuthoring(value).discovery.interests,['Books']);
  assert.throws(()=>parseAuthoring({...value,departmentIds:['lifestyle']}));
  assert.throws(()=>parseAuthoring({...value,discovery:{ageMin:80,ageMax:18}}));
  assert.throws(()=>parseAuthoring({...value,version:3}));
});
test('unrelated AARVIKA goods publish without occasion/recipient; legacy parser behavior and custom fields survive', () => {
  const aarvika={...blankAuthoring(),departmentIds:['stationery'],canonicalCategoryId:'paper',productType:'paper'};
  const input={title:'Demo paper',sku:'PAPER',price:199.95,mrp:199.95,status:'live',images:[{url:'/file.svg'}],categoryIds:['paper'],personalization:{enabled:true,fields:['Caption'],maxCharacters:32,imageUpload:true},delivery:{fee:20,midnight:true},aarvika};
  const parsed=parseProductInput(input);
  assert.equal(parsed.personalization.imageUpload,true);
  assert.equal(parsed.personalization.maxCharacters,32);
  assert.equal(parsed.delivery.midnight,true);
  assert.equal(parsed.aarvika?.productType,'paper');
  assert.throws(()=>parseProductInput({...input,aarvika:undefined}),/occasion/);
  assert.throws(()=>validateAuthoring(blankAuthoring(),true),/Publishing/);
});

test('department constraints validate furniture measurements, personalization, kit limits and size guides',()=>{
  assert.throws(()=>parseAuthoring({...blankAuthoring(),departmentIds:['furniture'],specs:{Width:'-1'}}),/dimensions/);
  assert.throws(()=>parseAuthoring({...blankAuthoring(),departmentIds:['furniture'],specs:{Unit:'inch'}}),/cm/);
  assert.throws(()=>parseAuthoring({...blankAuthoring(),personalization:{fields:[{key:'caption',label:'Caption',kind:'text',maxLength:0}]}}),/Character/);
  assert.throws(()=>parseAuthoring({...blankAuthoring(),personalization:{fields:[],photoMimeTypes:['image/svg+xml']}}),/photos/);
  assert.throws(()=>parseAuthoring({...blankAuthoring(),departmentIds:['hampers'],bundle:{components:[],minItems:1,maxItems:8,capacity:2}}),/limits/);
  assert.throws(()=>parseAuthoring({...blankAuthoring(),sizeGuide:{unit:'cm',rows:[{size:'M',chest:90,length:60},{size:'m',chest:92,length:62}]}}),/unique/);
  const valid=parseAuthoring({...blankAuthoring(),departmentIds:['clothing'],sizeGuide:{unit:'cm',rows:[{size:'M',chest:90,length:60}],instructions:'Demo garment measurements'}});
  assert.equal(valid.sizeGuide?.rows[0].chest,90);
});

test('internal inquiry review requires a revision, supported state and integer paise without modifying customer inputs',()=>{
  const input={revision:1,status:'demo-quote',internalNote:'Demo only; not sent',quotePaise:199995};
  assert.equal(parseInquiryUpdate(input).quotePaise,199995);
  for(const change of [{revision:0},{status:'paid'},{quotePaise:0},{quotePaise:1.5},{customerLabel:'overwrite'}])assert.throws(()=>parseInquiryUpdate({...input,...change}));
});
