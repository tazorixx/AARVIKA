"use client";
export function MerchandisingPreview({title,subtitle,image,active}:{title:string;subtitle?:string;image?:string;active:boolean}){
 return <details className="rounded-[12px] border border-[#E9DDF7] bg-[#FAF7FD] p-3"><summary className="cursor-pointer text-xs font-bold text-[#3E155C]">Preview this card</summary><div className="mt-3 overflow-hidden rounded-[12px] border border-slate-200 bg-white">{image&&<img src={image} alt={title+' preview'} className="h-28 w-full object-cover"/>}<div className="p-3"><p className="text-sm font-bold text-[#3E155C]">{title||'Item title'}</p>{subtitle&&<p className="mt-1 text-xs text-slate-600">{subtitle}</p>}<p className="mt-2 text-[11px] text-slate-500">{active?'Visible when saved':'Hidden when saved'}</p></div></div></details>;
}
