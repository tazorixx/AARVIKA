import {createHash} from 'node:crypto';
import plan from './media-batch-plan.json';
export function approvedMediaBatch(batchId:unknown){
 if(process.env.AARVIKA_SHARED!=='true'||process.env.FIREBASE_PROJECT_ID!=='gift4u-4210f')throw Error('Shared media batch mode is not enabled.');
 if(batchId!==plan.batchId||process.env.AARVIKA_APPROVED_MEDIA_BATCH!==plan.batchId)throw Error('This exact media batch requires owner approval before execution.');
 return plan;
}
export async function uploadMediaBatchAsset(form:FormData){
 const batch=approvedMediaBatch(form.get('batchId')),asset=batch.assets.find(a=>a.id===form.get('assetId')),file=form.get('file');
 if(!asset||!(file instanceof File)||file.size!==asset.bytes||file.size>10*1024*1024)throw Error('Unknown or altered batch asset.');
 return uploadStableImageKitAsset(asset,file,'batch-'+plan.batchId.slice(0,12));
}
/** Shared server-only uploader. Callers must authenticate/authorize before calling. */
export async function uploadStableImageKitAsset(asset:{sha256:string;bytes:number;filename:string;folder:string},file:File,tag:string){
 if(!/^[a-zA-Z0-9_-]+\.webp$/.test(asset.filename)||!/^\/aarvika\/[a-zA-Z0-9_/-]+$/.test(asset.folder)||file.size!==asset.bytes||file.size>10*1024*1024)throw Error('Invalid image asset.');
 const bytes=Buffer.from(await file.arrayBuffer());if(createHash('sha256').update(bytes).digest('hex')!==asset.sha256)throw Error('Batch asset checksum mismatch.');
 const key=process.env.IMAGEKIT_PRIVATE_KEY?.trim();if(!key)throw Error('ImageKit is not configured.');
 const Authorization='Basic '+Buffer.from(key+':').toString('base64');
 async function existing(){
  const url=new URL('https://api.imagekit.io/v1/files');url.searchParams.set('path',asset!.folder);url.searchParams.set('searchQuery',`name = "${asset!.filename}"`);url.searchParams.set('limit','10');
  const response=await fetch(url,{headers:{Authorization},signal:AbortSignal.timeout(30000)});if(!response.ok)throw Error('ImageKit lookup failed; retry safely.');
  const data=await response.json() as {filePath:string;url:string;fileId:string;size:number}[];
  const found=data.find(a=>a.filePath===asset!.folder+'/'+asset!.filename);
  if(found&&found.size!==asset!.bytes)throw Error('Existing asset size does not match batch.');return found;
 }
 const found=await existing();if(found)return {...found,reused:true};
 const upstream=new FormData();upstream.append('file',new Blob([bytes],{type:'image/webp'}),asset.filename);upstream.append('fileName',asset.filename);upstream.append('folder',asset.folder);upstream.append('useUniqueFileName','false');upstream.append('overwriteFile','false');upstream.append('tags','aarvika,merchandising,'+tag);
 try{
  const response=await fetch('https://upload.imagekit.io/api/v1/files/upload',{method:'POST',headers:{Authorization},body:upstream,signal:AbortSignal.timeout(45000)});
  if(!response.ok)throw Error('ImageKit upload incomplete; retry safely.');
  const result=await response.json() as {url:string;fileId:string;filePath:string};
  if(!result.url||!result.fileId||result.filePath!==asset.folder+'/'+asset.filename)throw Error('Unexpected ImageKit asset response.');return {...result,reused:false};
 }catch{const recovered=await existing();if(recovered)return {...recovered,reused:true};throw Error('ImageKit upload incomplete; resume this batch.');}
}
