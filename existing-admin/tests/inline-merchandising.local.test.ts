import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';

test('inline Birthday recipient creation and existing selection are atomic in the isolated emulator',async()=>{
  if(process.env.AARVIKA_SHARED==='true'||process.env.FIREBASE_PROJECT_ID&&process.env.FIREBASE_PROJECT_ID!=='demo-aarvika-local')throw Error('This test refuses a non-isolated Firebase project.');
  process.env.AARVIKA_ISOLATED='true';process.env.NEXT_PUBLIC_AARVIKA_ISOLATED='true';process.env.FIREBASE_PROJECT_ID='demo-aarvika-local';process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID='demo-aarvika-local';process.env.FIREBASE_AUTH_EMULATOR_HOST='127.0.0.1:9099';process.env.FIRESTORE_EMULATOR_HOST='127.0.0.1:8080';
  const {assertIsolatedServer}=await import('../src/lib/isolated.ts');assertIsolatedServer();
  const {normalizeMerchandisingItemInput,createMerchandisingItemWithMaster,createMerchandisingItem}=await import('../src/lib/merchandising/server.ts');
  const {getAdminDb}=await import('../src/lib/firebase-admin.ts');
  const suffix=randomUUID().slice(0,8),name='Inline recipient '+suffix,slug='inline-recipient-'+suffix;
  const first=normalizeMerchandisingItemInput('birthday',{type:'recipient',name,slug,active:true});
  let result:{id:string;masterId:string}|undefined,secondId:string|undefined;
  try{
    result=await createMerchandisingItemWithMaster('birthday',first,{name});
    const db=getAdminDb(),master=await db.collection('recipients').doc(result.masterId).get(),item=await db.collection('merchandising_pages').doc('birthday').collection('items').doc(result.id).get();
    assert.equal(master.data()?.name,name);assert.equal(item.data()?.relatedId,result.masterId);
    const selected=normalizeMerchandisingItemInput('birthday',{type:'recipient',name:name+' selected',slug:slug+'-selected',relatedId:result.masterId,active:true});
    secondId=await createMerchandisingItem('birthday',selected);
    assert.equal((await db.collection('merchandising_pages').doc('birthday').collection('items').doc(secondId).get()).data()?.relatedId,result.masterId);
    await assert.rejects(()=>createMerchandisingItemWithMaster('birthday',normalizeMerchandisingItemInput('birthday',{type:'recipient',name:name+' duplicate',slug:slug+'-duplicate'}),{name}),/matching catalogue record|already used|slug is already in use/i);
  }finally{
    if(result){const db=getAdminDb(),batch=db.batch(),items=db.collection('merchandising_pages').doc('birthday');batch.delete(db.collection('recipients').doc(result.masterId));batch.delete(db.collection('slugs').doc('recipients_'+slug));batch.delete(items.collection('items').doc(result.id));batch.delete(items.collection('item_slug_locks').doc('recipient_'+slug));if(secondId){batch.delete(items.collection('items').doc(secondId));batch.delete(items.collection('item_slug_locks').doc('recipient_'+slug+'-selected'));}await batch.commit();}
  }
});
