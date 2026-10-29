'use client';
import {useState, type Dispatch, type SetStateAction} from 'react';
import {auth} from '@/lib/firebase';
import {isImageKitReference} from '@aarvika/catalogue/media-policy';
import type {VisualMedia} from '@aarvika/catalogue/visual-commerce';

export function VisualUploadControls({type,recordId,draft,setDraft,busy,setBusy,setMessage}:{type:'categories'|'collections';recordId:string;draft:VisualMedia;setDraft:Dispatch<SetStateAction<VisualMedia>>;busy:boolean;setBusy:Dispatch<SetStateAction<boolean>>;setMessage:Dispatch<SetStateAction<string>>}) {
 const [uploading,setUploading]=useState(false);
 if(process.env.NEXT_PUBLIC_AARVIKA_SHARED!=='true')return null;
 async function upload(file:File,kind:'thumbnail'|'hero') {
  if(!auth.currentUser) {setMessage('Sign in again before uploading.');return;}
  if(kind==='hero'&&(draft.images?.length??0)>=5){setMessage('Use at most five hero images.');return;}
  setUploading(true);setBusy(true);setMessage('');
  try {
   const form=new FormData();form.append('file',file);form.append('assetKind',type==='categories'?'category':'collection');form.append('recordId',recordId);
   const response=await fetch('/api/admin/uploads/imagekit',{method:'POST',headers:{Authorization:'Bearer '+await auth.currentUser.getIdToken()},body:form});
   const data=await response.json();
   if(!response.ok||!isImageKitReference(data.url))throw Error(data.error||'ImageKit did not return a valid public image URL.');
   setDraft(current=>kind==='thumbnail'?{...current,imagePath:data.url,imageAlt:current.imageAlt||current.title||'Category image'}:{...current,images:[...current.images??[],{imagePath:data.url,imageAlt:current.title||'Category hero image',imageFit:'cover'}]});
   setMessage('Image uploaded. Save the visual draft, then publish it when ready.');
  } catch(error){setMessage((error as Error).message);}
  finally{setUploading(false);setBusy(false);}
 }
 return <div className="mt-3 rounded-xl border border-[#E9DDF7] bg-[#FAF7FD] p-3 text-xs">
  <p className="font-semibold text-[#3E155C]">Images from ImageKit</p>
  <p className="mt-1 text-slate-600">The thumbnail appears on category cards. Hero images form the page gallery. Save a draft before publishing.</p>
  {!!draft.imagePath&&<button type="button" disabled={busy||uploading} className="mt-2 rounded-full border px-3 py-2" onClick={()=>setDraft(current=>({...current,imagePath:''}))}>Remove thumbnail</button>}
  <div className="mt-3 flex flex-wrap gap-2">{(['thumbnail','hero'] as const).map(kind=><label key={kind} className="cursor-pointer rounded-full border border-[#62298E] px-3 py-2 font-semibold text-[#62298E]">{uploading?'Uploading…':kind==='thumbnail'?'Upload thumbnail':'Add hero image'}<input className="sr-only" type="file" accept="image/png,image/jpeg,image/webp" disabled={busy||uploading} onChange={event=>{const file=event.currentTarget.files?.[0];if(file)void upload(file,kind);event.currentTarget.value='';}}/></label>)}</div>
  {!!draft.images?.length&&<div className="mt-3 space-y-2">{draft.images.map((item,index)=><div key={item.imagePath} className="flex items-center gap-2 rounded-lg bg-white p-2"><img src={item.imagePath} alt={item.imageAlt} className="h-12 w-12 rounded object-cover"/><label className="min-w-0 flex-1">Hero {index+1} description<input aria-label={`Hero ${index+1} description`} className="mt-1 w-full rounded border px-2 py-1" value={item.imageAlt} onChange={event=>setDraft(current=>({...current,images:current.images?.map((image,i)=>i===index?{...image,imageAlt:event.target.value}:image)}))}/></label><button type="button" disabled={busy} onClick={()=>setDraft(current=>({...current,images:current.images?.filter((_,i)=>i!==index)}))} className="rounded border px-2 py-1">Remove</button></div>)}</div>}
 </div>;
}
