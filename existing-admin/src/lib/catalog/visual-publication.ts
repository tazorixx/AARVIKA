import {FieldValue} from 'firebase-admin/firestore';
import {getAdminDb} from '@/lib/firebase-admin';
import {parseVisualMedia} from '@aarvika/catalogue/visual-commerce';
import {isImageKitReference} from '@aarvika/catalogue/media-policy';
/** Additive metadata history. Does not mutate taxonomy, product identity or inventory. */
export async function updateVisual(type:'categories'|'collections',id:string,body:Record<string,unknown>,actorUid:string){
 if(!['draft','publish','rollback'].includes(String(body.visualAction)))throw Error('Invalid visual action.');
 if(!Number.isSafeInteger(body.expectedVisualRevision)||Number(body.expectedVisualRevision)<0)throw Error('Reload visual metadata before saving.');
 const db=getAdminDb(),ref=db.collection(type).doc(id);
 return db.runTransaction(async tx=>{
  const snap=await tx.get(ref);if(!snap.exists)throw Error('Not found.');const record=snap.data()!,revision=Number(record.visualRevision??0),version=Number(record.visualVersion??0);
  if(body.expectedVisualRevision!==revision)throw Error('Visual content changed elsewhere. Reload before saving.');
  let visual=body.visualAction==='draft'?parseVisualMedia(body.visual):parseVisualMedia(record.visualDraft??record.visualPublished??{});
  if(body.visualAction==='rollback'){
   if(!Number.isSafeInteger(body.version)||Number(body.version)<0)throw Error('Choose a published visual version.');
   const old=await tx.get(ref.collection('visual_versions').doc(String(body.version)));if(!old.exists)throw Error('Visual version not found.');visual=parseVisualMedia(old.data()!.visual);
  }
  if(process.env.AARVIKA_SHARED==='true' && (visual.imagePath&&!isImageKitReference(visual.imagePath)||visual.images?.some(image=>!isImageKitReference(image.imagePath)))) throw Error('Shared category and collection images must use public ImageKit URLs.');
  if(body.visualAction==='draft')tx.update(ref,{visualDraft:visual,visualRevision:revision+1});
  else{
   if(version===0)tx.set(ref.collection('visual_versions').doc('0'),{visual:record.visualPublished??{},actorUid,createdAt:FieldValue.serverTimestamp()});
   tx.set(ref.collection('visual_versions').doc(String(version+1)),{visual,actorUid,createdAt:FieldValue.serverTimestamp()});
   tx.update(ref,{visualPublished:visual,visualDraft:visual,visualRevision:revision+1,visualVersion:version+1,visualVersions:[...new Set([0,...record.visualVersions??[],version+1])].slice(-20)});
  }
  return {revision:revision+1,version:body.visualAction==='draft'?version:version+1};
 });
}
