import test from 'node:test';
import assert from 'node:assert/strict';
import { changeCartVariant, buildDemoReview, cartFingerprint } from '../src/domain/demo-review.ts';
import { addLine } from '../src/domain/cart.ts';
import { demoSnapshot } from '../../../packages/catalogue/src/fixture-adapter.ts';
const d=demoSnapshot();
const line=(skuId:string,quantity=1)=>({skuId,quantity,personalization:{},media:[],giftMessage:'For you',previewUnitPrice:{amount:1,currency:'INR' as const}});
const address={id:'sample',name:'Demo',phone:'9876543210',line:'Sample street',city:'Pune',state:'Maharashtra',pincode:'411001'};
test('changing a cart variant preserves details, merges matching lines and enforces aggregate SKU stock',()=>{
  let lines=addLine([],line('cotton-kurta-standard'),d.skus);lines=addLine(lines,line('cotton-kurta-large',2),d.skus);
  const original=JSON.stringify(lines),next=changeCartVariant(lines,lines[0].id,'cotton-kurta-large',d.skus);
  assert.equal(next.length,1);assert.equal(next[0].quantity,3);assert.equal(next[0].giftMessage,'For you');assert.equal(next[0].previewUnitPrice.amount,139900);assert.equal(JSON.stringify(lines),original);
  assert.throws(()=>changeCartVariant(lines,lines[0].id,'name-mug-standard',d.skus));assert.throws(()=>changeCartVariant(addLine([],line('cotton-kurta-standard',5),d.skus),lines[0].id,'cotton-kurta-large',d.skus));
});
test('local review reprices canonical demo SKUs, snapshots address and never creates a paid order',()=>{
  const lines=addLine([],line('cotton-kurta-standard',2),d.skus),input={lines,addresses:[address],addressId:address.id,products:d.products,skus:d.skus,schemas:d.schemas,templates:d.bundleTemplates,id:'demo-review',at:'2026-10-25T00:00:00Z'};
  const review=buildDemoReview(input);assert.equal(review.subtotal.amount,259800);assert.equal(review.payment,'disabled');assert.equal(review.status,'local-review');assert.equal(review.fingerprint,cartFingerprint(lines));
  review.address.city='Changed';assert.equal(address.city,'Pune');assert.throws(()=>buildDemoReview({...input,addressId:'someone-else'}));assert.throws(()=>buildDemoReview({...input,lines:[]}));
});
