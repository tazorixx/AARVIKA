import {NextResponse} from 'next/server';
import {FieldValue} from 'firebase-admin/firestore';
import {requireAdmin,errorResponse} from '@/lib/catalog/http';
import {getAdminDb} from '@/lib/firebase-admin';
import {approvedMediaBatch} from '@/lib/catalog/media-batch-upload';
import {parseCategoryInput} from '@/lib/catalog/validation';
import {slugLockRef,assertSlugAvailable,writeSlugLock} from '@/lib/catalog/slugs';
import {validateCategoryPlacement,type AuthoringCategory} from '@aarvika/catalogue/admin-contracts';
import {parseVisualMedia} from '@aarvika/catalogue/visual-commerce';
export const runtime='nodejs';
export async function POST(request:Request){
 try{
  const caller=await requireAdmin(request,['SUPER_ADMIN']);
  const body=await request.json(),plan=approvedMediaBatch(body.batchId),db=getAdminDb();
  function receipt(id:string){
   const a=plan.assets.find(a=>a.id===id),value=body.assets?.[id];
   if(!a||!value||typeof value.fileId!=='string'||!value.fileId||typeof value.url!=='string')throw Error('Upload receipt missing.');
   const url=new URL(value.url),endpoint=new URL(process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT||process.env.IMAGEKIT_URL_ENDPOINT||'https://ik.imagekit.io/gift4u4210');
   if(url.origin!==endpoint.origin||url.pathname!==endpoint.pathname.replace(/\/$/,'')+a.folder+'/'+a.filename||url.search||url.hash)throw Error('Receipt does not match the approved asset location.');
   return {url:value.url as string,fileId:value.fileId as string};
  }
  if(body.kind==='category'){
   const item=plan.categories.find(c=>c.id===body.id);if(!item)throw Error('Category is not in this batch.');
   const media=receipt(item.assetId),data=parseCategoryInput(item),ref=db.collection('categories').doc(item.id);
   const result=await db.runTransaction(async tx=>{
    const old=await tx.get(ref);if(old.exists){if(old.data()?.initialMediaAssignment?.batchId===plan.batchId)return 'already-created-preserved';throw Error('Category already exists. Review its current fields before any update.');}
    const lock=await tx.get(slugLockRef(db,'categories',data.slug));assertSlugAvailable(lock,item.id);
    const ancestors:AuthoringCategory[]=[];let parentId=item.parentId;
    while(parentId){if(ancestors.length>=2)throw Error('Invalid parent depth.');const parent=await tx.get(db.collection('categories').doc(parentId));if(!parent.exists)throw Error('Import the parent category first.');const row={id:parent.id,...parent.data()} as AuthoringCategory;ancestors.push(row);parentId=row.parentId??null;}
    if(!item.parentId){const roots=await tx.get(db.collection('categories').where('departmentId','==',item.departmentId).where('parentId','==',null));ancestors.push(...roots.docs.map(d=>({id:d.id,...d.data()}) as AuthoringCategory));}
    const hierarchy=validateCategoryPlacement(ancestors,{...data,id:item.id} as AuthoringCategory);
    const visual=parseVisualMedia({title:item.name,imagePath:media.url,imageAlt:item.imageAlt,imageFit:'cover',fallbackPath:item.fallbackPath});
    writeSlugLock(tx,db,'categories',data.slug,item.id);
    tx.create(ref,{...data,level:hierarchy.level,image:media.url,visualDraft:visual,visualPublished:visual,visualRevision:0,visualVersion:0,visualVersions:[],initialMediaAssignment:{batchId:plan.batchId,assetId:item.assetId,imageKitFileId:media.fileId,actorUid:caller.uid},createdAt:FieldValue.serverTimestamp(),updatedAt:FieldValue.serverTimestamp()});
    return 'created';
   });return NextResponse.json({id:item.id,status:result});
  }
  if(body.kind==='hero'){
   const item=plan.heroes.find(h=>h.department===body.id);if(!item)throw Error('Hero is not in this batch.');
   const mobile=receipt(item.mobile.assetId),desktop=receipt(item.desktop.assetId),ref=db.doc(item.record);
   const result=await db.runTransaction(async tx=>{const old=await tx.get(ref);if(old.data()?.initialMediaBatch===plan.batchId)return 'already-created-preserved';if(old.exists)throw Error('Hero parent record exists. Review its current fields before any update.');tx.create(ref,{hero:{...item.config,mobileImage:mobile.url,desktopImage:desktop.url},initialMediaBatch:plan.batchId,initialImageKitIds:{mobile:mobile.fileId,desktop:desktop.fileId},updatedBy:caller.uid,updatedAt:FieldValue.serverTimestamp()});return 'created';});
   return NextResponse.json({id:body.id,status:result});
  }
  throw Error('Choose a category or hero from the approved batch.');
 }catch(error){return errorResponse(error);}
}
