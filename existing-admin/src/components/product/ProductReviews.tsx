"use client";
import Image from "next/image";
import { useEffect,useState } from "react";
import { Loader2,Star,Upload,Flag } from "lucide-react";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
type Review={id:string;userName:string;rating:number;title:string;body:string;createdAt?:string;verifiedPurchase?:boolean;photoUrls?:string[];adminResponse?:string};
type Form={rating:number;title:string;body:string;photoUrls:string[]};
export default function ProductReviews({productId}:{productId:string}){const{user}=useAuth();const[reviews,setReviews]=useState<Review[]>([]),[myReview,setMyReview]=useState<Review|null>(null),[canReview,setCanReview]=useState(false),[loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[uploading,setUploading]=useState(false),[error,setError]=useState("");const[form,setForm]=useState<Form>({rating:5,title:"",body:"",photoUrls:[]});
const loadReviews=async()=>{setLoading(true);try{const h:HeadersInit={};if(auth.currentUser)h.Authorization=`Bearer ${await auth.currentUser.getIdToken()}`;const r=await fetch(`/api/products/${productId}/reviews`,{headers:h,cache:"no-store"});const d=await r.json();if(!r.ok)throw new Error(d.error||"Unable to load reviews.");setReviews(d.reviews||[]);setMyReview(d.myReview||null);setCanReview(Boolean(d.canReview));}catch(e){setError(e instanceof Error?e.message:"Unable to load reviews.");}finally{setLoading(false);}};useEffect(()=>{void Promise.resolve().then(() => loadReviews());},[productId,user]);
const upload=async(file:File)=>{setUploading(true);try{const token=await auth.currentUser?.getIdToken();if(!token)throw new Error("Please sign in again.");const fd=new FormData();fd.append("file",file);const r=await fetch("/api/products/reviews/upload",{method:"POST",headers:{Authorization:`Bearer ${token}`},body:fd});const d=await r.json();if(!r.ok)throw new Error(d.error||"Unable to upload image.");setForm(x=>({...x,photoUrls:[...x.photoUrls,d.url].slice(0,5)}));}catch(e){setError(e instanceof Error?e.message:"Unable to upload image.");}finally{setUploading(false);}};
const submit=async()=>{setSaving(true);setError("");try{const token=await auth.currentUser?.getIdToken();if(!token)throw new Error("Please sign in to write a review.");const r=await fetch(`/api/products/${productId}/reviews`,{method:"POST",headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json"},body:JSON.stringify(form)});const d=await r.json();if(!r.ok)throw new Error(d.error||"Unable to submit review.");setMyReview({id:d.reviewId,userName:"You",rating:form.rating,title:form.title,body:form.body,verifiedPurchase:d.verifiedPurchase,photoUrls:form.photoUrls});}catch(e){setError(e instanceof Error?e.message:"Unable to submit review.");}finally{setSaving(false);}};
const report=async(id:string)=>{try{const token=await auth.currentUser?.getIdToken();if(!token)throw new Error("Please sign in to report a review.");const reason=window.prompt("Why are you reporting this review?","Inappropriate content")||"Other";const r=await fetch(`/api/products/${productId}/reviews/${id}/report`,{method:"POST",headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json"},body:JSON.stringify({reason})});const d=await r.json();if(!r.ok)throw new Error(d.error||"Unable to report review.");window.alert("Thanks. The review has been reported.");}catch(e){window.alert(e instanceof Error?e.message:"Unable to report review.");}};
return (
  <section className="mt-10 rounded-[14px] border border-[#e6edf2] bg-white p-5 md:p-7">
    <p className="text-xs font-bold uppercase tracking-[.12em] text-[#d92f66]">Customer voices</p>
    <h2 className="gift-heading mt-1 text-2xl font-bold text-[#214c72] md:text-3xl">Reviews</h2>
    {loading ? (
      <div className="mt-6 flex justify-center"><Loader2 className="animate-spin text-[#d92f66]" /></div>
    ) : (
      <>
        <div className="mt-5 space-y-4">
          {reviews.length === 0 ? (
            <p className="text-sm text-slate-500">No approved reviews yet. Be the first to share your experience.</p>
          ) : (
            reviews.map((r) => (
              <article key={r.id} className="rounded-[14px] border border-[#edf1f4] bg-[#fffafd] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star key={n} size={15} className={n <= r.rating ? "fill-[#d92f66] text-[#d92f66]" : "text-slate-300"} />
                    ))}
                  </div>
                  {user && (
                    <button type="button" onClick={() => void report(r.id)} className="text-xs font-semibold text-slate-400 hover:text-[#bd1d52]" aria-label="Report review">
                      <Flag size={13} />
                    </button>
                  )}
                </div>
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  {r.userName}
                  {r.verifiedPurchase && <span className="ml-2 rounded-full bg-[#eaf6ef] px-2 py-0.5 text-[#257342]">Verified purchase</span>}
                </p>
                <h3 className="gift-heading mt-2 text-lg font-bold text-[#214c72]">{r.title}</h3>
                <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-600">{r.body}</p>
                {r.photoUrls && r.photoUrls.length > 0 && (
                  <div className="mt-3 flex gap-2 overflow-x-auto">
                    {r.photoUrls.map((url, i) => <Image key={`${url}-${i}`} src={url} alt="Customer review" width={80} height={80} className="h-20 w-20 rounded-xl object-cover" />)}
                  </div>
                )}
                {r.adminResponse && (
                  <div className="mt-3 rounded-xl bg-[#f5fbff] p-3 text-sm text-[#214c72]">
                    <span className="font-bold">Gift4U response:</span> {r.adminResponse}
                  </div>
                )}
              </article>
            ))
          )}
        </div>
        {user && (
          <div className="mt-7 border-t border-[#edf1f4] pt-6">
            {myReview ? (
              <div className="rounded-[14px] bg-[#f5fbff] p-4 text-sm text-[#214c72]">You have already submitted a review. It will appear publicly after admin approval.</div>
            ) : !canReview ? (
              <div className="rounded-[14px] bg-[#fff8ee] p-4 text-sm text-slate-600">Review this product after your order has been delivered.</div>
            ) : (
              <>
                <h3 className="gift-heading text-xl font-bold text-[#214c72]">Write a review</h3>
                <div className="mt-3 flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => <button type="button" key={n} onClick={() => setForm((x) => ({ ...x, rating: n }))}><Star size={22} className={n <= form.rating ? "fill-[#d92f66] text-[#d92f66]" : "text-slate-300"} /></button>)}
                </div>
                <input value={form.title} onChange={(e) => setForm((x) => ({ ...x, title: e.target.value }))} placeholder="Review title" maxLength={120} className="mt-3 w-full rounded-full border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#2f628f]" />
                <textarea value={form.body} onChange={(e) => setForm((x) => ({ ...x, body: e.target.value }))} placeholder="Tell others about your experience" maxLength={3000} rows={4} className="mt-3 w-full rounded-[14px] border border-slate-200 p-4 text-sm outline-none focus:border-[#2f628f]" />
                <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-bold text-[#214c72]">
                  <Upload size={15} /> {uploading ? "Uploading…" : "Add photos"}
                  <input type="file" accept="image/*" multiple hidden onChange={(e) => { const files = Array.from(e.target.files || []).slice(0, 5 - form.photoUrls.length); files.forEach((f) => void upload(f)); e.currentTarget.value = ""; }} />
                </label>
                {form.photoUrls.length > 0 && <div className="mt-3 flex gap-2">{form.photoUrls.map((u) => <Image key={u} src={u} alt="Selected review" width={64} height={64} className="h-16 w-16 rounded-lg object-cover" />)}</div>}
                <button type="button" disabled={saving || uploading} onClick={() => void submit()} className="mt-3 rounded-full bg-[#d92f66] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50">{saving ? "Submitting…" : "Submit review"}</button>
              </>
            )}
            {error && <p className="mt-3 text-sm font-semibold text-[#bd1d52]">{error}</p>}
          </div>
        )}
      </>
    )}
  </section>
);
}
