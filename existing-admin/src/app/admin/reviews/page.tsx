"use client";
import type { AdminReview } from "@/lib/admin/reviews";

import { useEffect, useState } from "react";
import { Check, Loader2, Search, X, Star } from "lucide-react";
import { auth } from "@/lib/firebase";
export default function AdminReviewsPage(){const[reviews,setReviews]=useState<AdminReview[]>([]);const[status,setStatus]=useState("pending");const[rating,setRating]=useState("all");const[q,setQ]=useState("");const[loading,setLoading]=useState(true);const[saving,setSaving]=useState("");const[responses,setResponses]=useState<Record<string,string>>({});
const load=async()=>{setLoading(true);try{const user=auth.currentUser;if(!user)return;const token=await user.getIdToken();const p=new URLSearchParams({limit:"100"});if(status!=="all")p.set("status",status);if(rating!=="all")p.set("rating",rating);if(q.trim())p.set("q",q.trim());const r=await fetch(`/api/admin/reviews?${p}`,{headers:{Authorization:`Bearer ${token}`},cache:"no-store"});const d=await r.json();if(!r.ok)throw new Error(d.error||"Unable to load reviews.");setReviews(d.reviews||[]);}catch(e){window.alert(e instanceof Error?e.message:"Unable to load reviews.");}finally{setLoading(false);}};
useEffect(()=>{void Promise.resolve().then(() => load());},[status,rating]);
const update=async(id:string,nextStatus:AdminReview["status"])=>{setSaving(id);try{const user=auth.currentUser;if(!user)throw new Error("Please sign in again.");const token=await user.getIdToken();const r=await fetch(`/api/admin/reviews/${id}`,{method:"PATCH",headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json"},body:JSON.stringify({status:nextStatus,adminResponse:responses[id]||""})});const d=await r.json();if(!r.ok)throw new Error(d.error||"Unable to update review.");setReviews(items=>items.map(item=>item.id===id?{...item,status:nextStatus}:item));}catch(e){window.alert(e instanceof Error?e.message:"Unable to update review.");}finally{setSaving("");}};
return (
  <main className="min-h-screen bg-[#fffafd] px-4 py-8 md:px-8">
    <div className="mx-auto max-w-7xl">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.16em] text-[#62298E]">Admin moderation</p>
          <h1 className="gift-heading mt-1 text-3xl font-bold text-[#3E155C]">Customer Reviews</h1>
          <p className="mt-2 text-sm text-slate-500">Moderate feedback and keep product ratings synchronized.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {["pending", "approved", "rejected", "all"].map((item) => (
            <button key={item} type="button" onClick={() => setStatus(item)} className={`rounded-full px-4 py-2 text-xs font-bold ${status === item ? "bg-[#3E155C] text-white" : "border border-slate-200 bg-white text-slate-600"}`}>
              {item[0].toUpperCase() + item.slice(1)}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-[14px] border border-[#e6edf2] bg-white p-4"><p className="text-xs uppercase tracking-wide text-slate-400">Showing</p><p className="mt-1 text-2xl font-bold text-[#3E155C]">{reviews.length}</p></div>
        <div className="rounded-[14px] border border-[#e6edf2] bg-white p-4"><p className="text-xs uppercase tracking-wide text-slate-400">5-star reviews</p><p className="mt-1 text-2xl font-bold text-[#62298E]">{reviews.filter((r) => r.rating === 5).length}</p></div>
        <div className="rounded-[14px] border border-[#e6edf2] bg-white p-4"><p className="text-xs uppercase tracking-wide text-slate-400">Average shown rating</p><p className="mt-1 text-2xl font-bold text-[#3E155C]">{reviews.length ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : "0.0"}/5</p></div>
      </div>
      <div className="mt-5 flex flex-col gap-3 rounded-[14px] border border-[#e6edf2] bg-white p-3 shadow-sm sm:flex-row">
        <div className="flex flex-1 gap-2">
          <Search size={18} className="mt-1 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") void load(); }} placeholder="Search product, customer, title or review" className="w-full bg-transparent text-sm outline-none" />
          <button type="button" onClick={() => void load()} className="rounded-full bg-[#62298E] px-4 py-2 text-xs font-bold text-white">Search</button>
        </div>
        <select value={rating} onChange={(e) => setRating(e.target.value)} className="rounded-full border border-slate-200 px-4 py-2 text-sm">
          <option value="all">All ratings</option>
          {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} stars</option>)}
        </select>
      </div>
      {loading ? (
        <div className="grid min-h-[240px] place-items-center"><Loader2 className="animate-spin text-[#62298E]" /></div>
      ) : (
        <div className="mt-5 space-y-4">
          {reviews.length === 0 ? (
            <div className="rounded-[14px] border border-[#e6edf2] bg-white p-10 text-center text-sm text-slate-500">No reviews found.</div>
          ) : reviews.map((review) => (
            <article key={review.id} className="rounded-[14px] border border-[#e6edf2] bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[#f5fbff] px-3 py-1 text-xs font-bold text-[#3E155C]">{review.productTitle || review.productId}</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#fff0f5] px-3 py-1 text-xs font-bold text-[#62298E]"><Star size={12} fill="currentColor" />{review.rating}/5</span>
                    <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-500">{review.status}</span>
                  </div>
                  <h2 className="gift-heading mt-3 text-xl font-bold text-[#3E155C]">{review.title || "Customer review"}</h2>
                  <p className="mt-1 text-xs font-semibold text-slate-500">By {review.userName} · {review.userId}</p>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">{review.body}</p>
                  {review.verifiedPurchase && <span className="mt-2 inline-flex rounded-full bg-[#eaf6ef] px-3 py-1 text-xs font-bold text-[#257342]">Verified purchase</span>}
                  {review.photoUrls && review.photoUrls.length > 0 && <div className="mt-3 flex gap-2">{review.photoUrls.map((url: string, i: number) => <img key={`${url}-${i}`} src={url} alt="Customer review" className="h-16 w-16 rounded-lg object-cover" />)}</div>}
                  {(review.reportCount ?? 0) > 0 && <p className="mt-2 text-xs font-semibold text-[#bd1d52]">Reports: {review.reportCount}</p>}
                  <div className="mt-4">
                    <textarea value={responses[review.id] ?? review.adminResponse ?? ""} onChange={(e) => setResponses((prev) => ({ ...prev, [review.id]: e.target.value }))} placeholder="Optional public response from AARVIKA" rows={2} maxLength={2000} className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-[#3E155C]" />
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  {review.status !== "approved" && <button type="button" disabled={saving === review.id} onClick={() => void update(review.id, "approved")} className="inline-flex items-center gap-1.5 rounded-full bg-[#3E155C] px-4 py-2 text-xs font-bold text-white disabled:opacity-50"><Check size={14} />Approve</button>}
                  {review.status !== "rejected" && <button type="button" disabled={saving === review.id} onClick={() => void update(review.id, "rejected")} className="inline-flex items-center gap-1.5 rounded-full border border-[#f0cbd7] bg-white px-4 py-2 text-xs font-bold text-[#bd1d52] disabled:opacity-50"><X size={14} />Reject</button>}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  </main>
);
}
