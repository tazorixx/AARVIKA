import {isCatalogueMedia} from '@aarvika/catalogue/media-policy';
import {FieldValue,type Transaction,type Firestore} from 'firebase-admin/firestore';
import {getAdminDb} from '@/lib/firebase-admin';
import {normalizeHomepageSection,validateHomepageInput,type HomepageSection} from './homepage';

async function validateReferences(tx:Transaction,db:Firestore,sections:HomepageSection[]){
 if(sections.length>400||sections.some(s=>sections.filter(other=>(other.pageKey||'home')===(s.pageKey||'home')).length>40))throw Error('Use at most 40 sections per page and 400 across mobile pages.');
 const products=await tx.get(db.collection('products')),categories=await tx.get(db.collection('categories')),collections=await tx.get(db.collection('collections'));
 const live=new Map(products.docs.filter(d=>d.data().status==='live').map(d=>[d.id,d.data()]));
 for(const section of sections){
  const valid=validateHomepageInput(section);if(!valid.valid)throw Error(valid.error);
  if(section.imageUrl&&!isCatalogueMedia(section.imageUrl))throw Error('Use a local asset or public ImageKit image.');
  if((section.productIds??[]).some(id=>!live.has(id)))throw Error('Homepage products must be published.');
  if(section.type==='collection'&&section.sourceId!=='@collections'&&!collections.docs.some(d=>d.id===section.sourceId&&d.data().active!==false))throw Error('Choose an active collection.');
  if(section.type==='categories'&&section.sourceId&&!section.sourceId.startsWith('@')&&!categories.docs.some(d=>d.id===section.sourceId&&d.data().active!==false))throw Error('Choose an active category.');
  if(section.selection==='best-sellers')throw Error('Best sellers require a verified sales ranking source. No such source is configured in this isolated workspace.');
 }
}

/** Atomic existing-section publication + immutable layout history. No production migration. */
export async function publishHomepage(input:{action:'publish'|'unpublish'|'delete'|'rollback'|'publish-layout';sectionId?:string;section?:HomepageSection;version?:number;expectedVersion?:number;actorUid:string;draftIds?:string[]}){
 const db=getAdminDb(),stateRef=db.collection('homepage_catalogue').doc('state');
 return db.runTransaction(async tx=>{
  const state=await tx.get(stateRef),version=Number(state.data()?.version??0);
  if(input.expectedVersion!==undefined&&input.expectedVersion!==version)throw Error('Homepage changed elsewhere. Reload before publishing.');
  const current=await tx.get(db.collection('homepage_sections'));
  const before=current.docs.map(d=>normalizeHomepageSection(d.id,d.data()));
  let draftIds:string[]=[];
  let after=before.filter(s=>s.id!==input.sectionId);
  if(input.action==='rollback'){
   if(!Number.isSafeInteger(input.version)||(input.version??-1)<0)throw Error('Choose a valid homepage version.');
   const snapshot=await tx.get(db.collection('homepage_versions').doc(String(input.version)));
   if(!snapshot.exists)throw Error('Homepage version not found.');
   after=snapshot.data()!.sections as HomepageSection[];
  }else if(input.action==='publish-layout'){
   const drafts=await tx.get(db.collection('homepage_drafts'));
   const merged=new Map(before.map(s=>[s.id,s]));
   for(const d of drafts.docs.filter(d=>!input.draftIds||input.draftIds.includes(d.id)))merged.set(d.id,{...normalizeHomepageSection(d.id,d.data()),status:'published',scheduledAt:null});
   after=[...merged.values()];
   draftIds=drafts.docs.filter(d=>!input.draftIds||input.draftIds.includes(d.id)).map(d=>d.id);
  }else if(input.action==='publish'){
   if(!input.section||!input.sectionId)throw Error('Section required.');
   after.push({...input.section,status:'published',scheduledAt:null});
  }
  after.sort((a,b)=>a.sortOrder-b.sortOrder);
  await validateReferences(tx,db,after);
  for(const id of draftIds)tx.delete(db.collection('homepage_drafts').doc(id));
  if(version===0)tx.set(db.collection('homepage_versions').doc('0'),{version:0,sections:before,actorUid:input.actorUid,createdAt:FieldValue.serverTimestamp()});
  for(const s of before)if(!after.some(a=>a.id===s.id))tx.delete(db.collection('homepage_sections').doc(s.id));
  for(const s of after)tx.set(db.collection('homepage_sections').doc(s.id),{...s,updatedAt:FieldValue.serverTimestamp()});
  if(input.sectionId&&input.action!=='unpublish')tx.delete(db.collection('homepage_drafts').doc(input.sectionId));
  tx.set(db.collection('homepage_versions').doc(String(version+1)),{version:version+1,sections:after,actorUid:input.actorUid,action:input.action,createdAt:FieldValue.serverTimestamp()});
  tx.set(stateRef,{version:version+1,pageKeys:[...new Set([...(state.data()?.pageKeys??[]),...after.map(s=>s.pageKey||'home')])],updatedAt:FieldValue.serverTimestamp()});
  return version+1;
 });
}
