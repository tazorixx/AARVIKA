import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {uploadMediaBatchAsset} from '../src/lib/catalog/media-batch-upload';
import plan from '../src/lib/catalog/media-batch-plan.json';
test('bulk upload validates approval/hash and recovers a completed upload after connection loss',async()=>{
 const oldFetch=globalThis.fetch,old={shared:process.env.AARVIKA_SHARED,project:process.env.FIREBASE_PROJECT_ID,approved:process.env.AARVIKA_APPROVED_MEDIA_BATCH,key:process.env.IMAGEKIT_PRIVATE_KEY};
 const a=plan.assets[0],bytes=await readFile('../visual-merchandising/'+a.file);
 const form=()=>{const f=new FormData();f.append('batchId',plan.batchId);f.append('assetId',a.id);f.append('file',new File([bytes],a.filename,{type:'image/webp'}));return f;};
 let uploads=0,lookups=0,exists=false;
 const result={filePath:a.folder+'/'+a.filename,url:'https://ik.imagekit.io/gift4u4210'+a.folder+'/'+a.filename,fileId:'local-test-file',size:a.bytes};
 try{
  process.env.AARVIKA_SHARED='true';process.env.FIREBASE_PROJECT_ID='gift4u-4210f';delete process.env.AARVIKA_APPROVED_MEDIA_BATCH;process.env.IMAGEKIT_PRIVATE_KEY='local-test-only';
  globalThis.fetch=async(input,init)=>{if(new URL(String(input)).hostname==='api.imagekit.io'){lookups++;return Response.json(exists?[result]:[]);}uploads++;const f=init?.body as FormData;assert.equal(f.get('overwriteFile'),'false');assert.equal(f.get('useUniqueFileName'),'false');exists=true;throw Error('Simulated lost response after successful upload');};
  await assert.rejects(uploadMediaBatchAsset(form()),/approval/);assert.equal(uploads+lookups,0);
  process.env.AARVIKA_APPROVED_MEDIA_BATCH=plan.batchId;
  const bad=form();bad.set('file',new File([new Uint8Array(bytes.length)],a.filename));await assert.rejects(uploadMediaBatchAsset(bad),/checksum/);assert.equal(uploads+lookups,0);
  const first=await uploadMediaBatchAsset(form());assert.equal(first.fileId,result.fileId);assert.equal(first.reused,true);assert.equal(uploads,1);
  await uploadMediaBatchAsset(form());assert.equal(uploads,1);assert.equal(lookups,3);
 }finally{globalThis.fetch=oldFetch;for(const [name,value] of Object.entries({AARVIKA_SHARED:old.shared,FIREBASE_PROJECT_ID:old.project,AARVIKA_APPROVED_MEDIA_BATCH:old.approved,IMAGEKIT_PRIVATE_KEY:old.key})){if(value===undefined)delete process.env[name];else process.env[name]=value;}}
});
