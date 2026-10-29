"use client";
type Product={id:string;title:string;aarvika?:{departmentIds?:string[]}};
export function FeaturedProductChoice({products,department,selected,onChange}:{products:Product[];department:string;selected:string[];onChange:(ids:string[])=>void}){
 const available=products.filter(product=>!product.aarvika?.departmentIds||product.aarvika.departmentIds.includes(department));
 return <div className="rounded-[12px] border border-slate-200 p-3"><p className="text-xs font-bold text-slate-600">Choose featured products</p><p className="mt-1 text-[11px] text-slate-500">Only published products appear. Choose up to 20.</p><div className="mt-2 grid max-h-44 gap-1 overflow-y-auto">{available.map(product=><label key={product.id} className="flex items-center gap-2 rounded px-2 py-1.5 text-xs"><input type="checkbox" checked={selected.includes(product.id)} onChange={event=>onChange(event.target.checked?[...selected,product.id].slice(0,20):selected.filter(id=>id!==product.id))}/>{product.title}</label>)}{!available.length&&<p className="px-2 py-3 text-xs text-slate-500">Publish a product in this department first.</p>}</div></div>;
}
