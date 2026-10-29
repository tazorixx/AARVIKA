"use client";

import { useEffect, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  CalendarClock,
  Eye,
  ImagePlus,
  Loader2,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import {CommercePageFields} from '@/components/admin/CommercePageFields';
import { HomepageSourceFields } from "@/components/admin/HomepageSourceFields";
import { auth } from "@/lib/firebase";
import type { HomepageSection, HomepageSectionType } from "@/lib/admin/homepage";

type Draft = Omit<HomepageSection, "id">;

const empty: Draft = {
  type: "banner",
  title: "",
  subtitle: "",
  imageUrl: "",
  linkUrl: "",
  buttonLabel: "",
  sortOrder: 0,
  isActive: true,
  status: "draft",
  scheduledAt: null,
};

export default function HomepageAdminPage() {
  const [pageFilter,setPageFilter]=useState('home');
  const [publication,setPublication]=useState<{version:number;history:{version:number;sectionCount:number}[]}|null>(null);
  const [rollbackVersion,setRollbackVersion]=useState("");
  const [sections, setSections] = useState<HomepageSection[]>([]);
  const [draft, setDraft] = useState<Draft>(empty);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [scheduling, setScheduling] = useState<string | null>(null);

  const token = async () => {
    const user = auth.currentUser;
    if (!user) throw new Error("Please sign in again.");
    return user.getIdToken();
  };

  const load = async () => {
    setLoading(true);
    setPublication(null);
    try {
      const response = await fetch("/api/admin/homepage", {
        headers: { Authorization: `Bearer ${await token()}` },
        cache: "no-store",
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Unable to load homepage sections.");
      }
      setSections(data.sections || []);
      const versions=await fetch("/api/admin/homepage/versions",{headers:{Authorization:`Bearer ${await token()}`},cache:"no-store"});
      const metadata=await versions.json();if(!versions.ok)throw Error(metadata.error||"Cannot load publication history.");setPublication(metadata);
    } catch (error) {
      window.alert(
        error instanceof Error
          ? error.message
          : "Unable to load homepage sections.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void Promise.resolve().then(() => load());
  }, []);

  const publishLayout=async(action:"rollback"|"publish-layout")=>{
    if(!publication)return;
    if(action==="rollback"&&!rollbackVersion)return;
    if(!window.confirm(action==="rollback"?`Restore published homepage version ${rollbackVersion}? Drafts remain available.`:"Publish all saved homepage drafts now?"))return;
    setSaving(true);
    try{const r=await fetch("/api/admin/homepage/versions",{method:"POST",headers:{Authorization:`Bearer ${await token()}`,"Content-Type":"application/json"},body:JSON.stringify({action,version:Number(rollbackVersion),expectedVersion:publication?.version})});const data=await r.json();if(!r.ok)throw Error(data.error||"Publication failed.");await load();}catch(e){window.alert(e instanceof Error?e.message:"Publication failed.");}finally{setSaving(false);}
  };

  const uploadImage = async (file: File, target: "draft" | string) => {
    if (!file.type.startsWith("image/")) {
      window.alert("Please select an image file.");
      return;
    }

    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);

      const response = await fetch("/api/admin/uploads/homepage-image", {
        method: "POST",
        headers: { Authorization: `Bearer ${await token()}` },
        body,
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to upload image.");
      }

      if (target === "draft") {
        setDraft((value) => ({ ...value, imageUrl: data.url }));
      } else {
        setSections((items) =>
          items.map((item) =>
            item.id === target ? { ...item, imageUrl: data.url } : item,
          ),
        );
      }
    } catch (error) {
      window.alert(
        error instanceof Error ? error.message : "Unable to upload image.",
      );
    } finally {
      setUploading(false);
    }
  };

  const create = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/admin/homepage", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${await token()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(draft),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to create section.");
      }

      setSections((items) =>
        [...items, data.section].sort((a, b) => a.sortOrder - b.sortOrder),
      );
      setDraft(empty);
    } catch (error) {
      window.alert(
        error instanceof Error ? error.message : "Unable to create section.",
      );
    } finally {
      setSaving(false);
    }
  };

  const requestPatch = async (
    id: string,
    patch: Partial<HomepageSection>,
  ) => {
    const response = await fetch(`/api/admin/homepage/${id}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${await token()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({...patch,expectedVersion:publication?.version}),
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Unable to update section.");
    }

    return data;
  };

  const save = async (section: HomepageSection) => {
    setSaving(true);
    try {
      const data = await requestPatch(section.id, section);
      if (data.section) update(section.id, data.section);
    } catch (error) {
      window.alert(
        error instanceof Error ? error.message : "Unable to save section.",
      );
    } finally {
      setSaving(false);
    }
  };

  const publish = async (section: HomepageSection) => {
    setSaving(true);
    try {
      const data = await requestPatch(section.id, { action: "publish" } as Partial<HomepageSection> & { action: string });
      if (data.section) await load();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Unable to publish section.");
    } finally { setSaving(false); }
  };

  const unpublish = async (section: HomepageSection) => {
    if (!window.confirm("Unpublish this section? It will remain as a draft.")) return;
    setSaving(true);
    try {
      const data = await requestPatch(section.id, { action: "unpublish" } as Partial<HomepageSection> & { action: string });
      if (data.ok) await load();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Unable to unpublish section.");
    } finally { setSaving(false); }
  };

  const schedule = async (section: HomepageSection) => {
    const value = window.prompt("Enter publish date/time in ISO format, e.g. 2026-10-01T10:00:00+05:30", section.scheduledAt || "");
    if (!value) return;
    setScheduling(section.id);
    try {
      const data = await requestPatch(section.id, { action: "schedule", scheduledAt: value } as Partial<HomepageSection> & { action: string; scheduledAt: string });
      if (data.section) setSections((items) => items.map((item) => item.id === section.id ? data.section : item));
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Unable to schedule section.");
    } finally { setScheduling(null); }
  };

  const remove = async (id: string) => {
    if (!window.confirm("Delete this homepage section?")) return;

    try {
      const response = await fetch(`/api/admin/homepage/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${await token()}` },
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to delete section.");
      }

      await load();
    } catch (error) {
      window.alert(
        error instanceof Error ? error.message : "Unable to delete section.",
      );
    }
  };

  const update = (id: string, patch: Partial<HomepageSection>) => {
    setSections((items) =>
      items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  };

  const move = async (id: string, direction: -1 | 1) => {
    const ordered = sections.filter(s=>(s.pageKey||'home')===pageFilter).sort((a, b) => a.sortOrder - b.sortOrder);
    const index = ordered.findIndex((item) => item.id === id);
    const next = index + direction;

    if (index < 0 || next < 0 || next >= ordered.length) return;

    const current = ordered[index];
    const target = ordered[next];
    const currentOrder = current.sortOrder;
    const targetOrder = target.sortOrder;

    setSections((items) =>
      items.map((item) => {
        if (item.id === current.id) return { ...item, sortOrder: targetOrder };
        if (item.id === target.id) return { ...item, sortOrder: currentOrder };
        return item;
      }),
    );

    try {
      await Promise.all([
        requestPatch(current.id, { sortOrder: targetOrder }),
        requestPatch(target.id, { sortOrder: currentOrder }),
      ]);
    } catch (error) {
      await load();
      window.alert(
        error instanceof Error ? error.message : "Unable to reorder section.",
      );
    }
  };

  const field = (
    label: string,
    value: string,
    onChange: (value: string) => void,
    placeholder = "",
  ) => (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold text-slate-600">
        {label}
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-[12px] border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#3E155C]"
      />
    </label>
  );

  return (
    <main className="min-h-screen bg-[#fffafd] px-4 py-8 md:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.16em] text-[#62298E]">
              Storefront content
            </p>
            <h1 className="gift-heading mt-1 text-3xl font-bold text-[#3E155C]">
              Homepage Builder
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Manage promotional sections, imagery, order and visibility without
              changing the existing catalog.
            </p>
          </div>
          <a
            href="/admin/homepage/preview"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-[#dbe6ee] px-5 py-3 text-sm font-bold text-[#3E155C]"
          >
            <Eye size={16} /> Preview drafts
          </a>
          <button
            onClick={() => setDraft(empty)}
            className="inline-flex items-center gap-2 rounded-full bg-[#62298E] px-5 py-3 text-sm font-bold text-white"
          >
            <Plus size={16} /> New section
          </button>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2 text-xs text-slate-600"><span>{publication?`Published version ${publication.version}`:"Loading publication history…"}</span><button disabled={saving||!publication} onClick={()=>void publishLayout("publish-layout")} className="rounded-full border border-slate-200 bg-white px-4 py-2 font-bold">Publish saved layout</button><select aria-label="Homepage rollback version" disabled={!publication} value={rollbackVersion} onChange={e=>setRollbackVersion(e.target.value)} className="rounded-full border border-slate-200 bg-white px-3 py-2"><option value="">Choose previous version</option>{(publication?.history??[]).filter(v=>v.version!==publication?.version).map(v=><option key={v.version} value={v.version}>Version {v.version} · {v.sectionCount} sections</option>)}</select><button disabled={saving||!publication||!rollbackVersion} onClick={()=>void publishLayout("rollback")} className="rounded-full border border-slate-200 bg-white px-4 py-2 font-bold">Rollback published layout</button></div>

        <section className="mt-6 rounded-[14px] border border-[#e6edf2] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="gift-heading text-xl font-bold text-[#3E155C]">
              {draft.title ? "New section" : "Add section"}
            </h2>
            <button
              onClick={() => setDraft(empty)}
              className="inline-flex items-center gap-1 text-xs font-bold text-slate-500"
            >
              <X size={14} /> Reset
            </button>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-slate-600">
                Type
              </span>
              <select
                value={draft.type}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    type: event.target.value as HomepageSectionType,
                  })
                }
                className="w-full rounded-[12px] border border-slate-200 bg-white px-3 py-2.5 text-sm"
              >
                <option value="hero">Hero</option>
                <option value="banner">Banner</option>
                <option value="text">Text</option>
                <option value="link">Link</option><option value="categories">Category section</option><option value="products">Product section</option><option value="collection">Custom collection</option>
              </select>
            </label>

            {field("Title", draft.title, (value) =>
              setDraft({ ...draft, title: value }),
            )}
            {field("Subtitle", draft.subtitle, (value) =>
              setDraft({ ...draft, subtitle: value }),
            )}
            {field("Image URL", draft.imageUrl, (value) =>
              setDraft({ ...draft, imageUrl: value }),
              "ImageKit URL",
            )}

            <label className="flex cursor-pointer items-center gap-2 self-end rounded-full border border-[#dbe6ee] px-4 py-2.5 text-xs font-bold text-[#3E155C]">
              <ImagePlus size={15} />
              {uploading ? "Uploading…" : "Upload image"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploading}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void uploadImage(file, "draft");
                  event.currentTarget.value = "";
                }}
              />
            </label>

            {field("Link URL", draft.linkUrl, (value) =>
              setDraft({ ...draft, linkUrl: value }),
              "/birthday",
            )}
            {field("Button label", draft.buttonLabel, (value) =>
              setDraft({ ...draft, buttonLabel: value }),
            )}
            {field("Sort order", String(draft.sortOrder), (value) =>
              setDraft({ ...draft, sortOrder: Number(value) || 0 }),
            )}

            <label className="flex items-center gap-2 self-end pb-2 text-xs font-bold text-slate-600">
              <input
                type="checkbox"
                checked={draft.isActive}
                onChange={(event) =>
                  setDraft({ ...draft, isActive: event.target.checked })
                }
              />
              Active
            </label>
          </div>

          <CommercePageFields section={draft} onChange={patch=>setDraft(v=>({...v,...patch}))}/><HomepageSourceFields section={draft} onChange={patch=>setDraft(current=>({...current,...patch}))}/>
          {draft.imageUrl ? (
            <img
              src={draft.imageUrl}
              alt="Homepage preview"
              className="mt-4 h-36 w-full rounded-[12px] object-cover"
            />
          ) : null}

          <button
            disabled={saving}
            onClick={() => void create()}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#62298E] px-5 py-2.5 text-xs font-bold text-white disabled:opacity-50"
          >
            <Plus size={15} /> Save draft
          </button>
        </section>

        {loading ? (
          <div className="grid min-h-[240px] place-items-center">
            <Loader2 className="animate-spin text-[#62298E]" />
          </div>
        ) : (
          <div className="mt-6 space-y-4"><label className="block text-xs font-bold text-slate-600">Editing mobile page<select aria-label="Editing mobile page" value={pageFilter} onChange={e=>setPageFilter(e.target.value)} className="ml-2 rounded-full border px-3 py-2">{[...new Set(['home',...sections.map(s=>s.pageKey||'home')])].map(key=><option key={key}>{key}</option>)}</select></label>
            {sections.filter(section=>(section.pageKey||'home')===pageFilter).length === 0 ? (
              <div className="rounded-[14px] border border-dashed border-[#cbd9e3] bg-white p-10 text-center text-sm text-slate-500">
                No optional homepage sections configured. The existing homepage
                remains unchanged.
              </div>
            ) : (
              sections.filter(s=>(s.pageKey||'home')===pageFilter).map((section, index) => (
                <article
                  key={section.id}
                  className="rounded-[14px] border border-[#e6edf2] bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <HomepageSourceFields section={section} onChange={patch=>update(section.id,patch)}/>
                  {section.imageUrl ? (
                        <img
                          src={section.imageUrl}
                          alt=""
                          className="h-16 w-24 rounded-[10px] object-cover"
                        />
                      ) : (
                        <div className="grid h-16 w-24 place-items-center rounded-[10px] bg-[#f5fbff] text-xs text-slate-400">
                          No image
                        </div>
                      )}
                      <div>
                        <div className="flex flex-wrap gap-2">
                          <span className="rounded-full bg-[#f5fbff] px-3 py-1 text-[11px] font-bold uppercase text-[#3E155C]">
                            {section.type}
                          </span>
                          <span className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase ${section.status === "published" ? "bg-emerald-50 text-emerald-700" : section.status === "scheduled" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600"}`}>
                            {section.status}
                          </span>
                        </div>
                        <h3 className="gift-heading mt-1 text-xl font-bold text-[#3E155C]">
                          {section.title || "Untitled section"}
                        </h3>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        disabled={index === 0}
                        onClick={() => void move(section.id, -1)}
                        className="rounded-full border border-slate-200 p-2 text-[#3E155C] disabled:opacity-40"
                        title="Move up"
                      >
                        <ArrowUp size={14} />
                      </button>
                      <button
                        disabled={index === sections.filter(s=>(s.pageKey||'home')===pageFilter).length - 1}
                        onClick={() => void move(section.id, 1)}
                        className="rounded-full border border-slate-200 p-2 text-[#3E155C] disabled:opacity-40"
                        title="Move down"
                      >
                        <ArrowDown size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {field("Title", section.title, (value) =>
                      update(section.id, { title: value }),
                    )}
                    {field("Subtitle", section.subtitle, (value) =>
                      update(section.id, { subtitle: value }),
                    )}
                    {field("Image URL", section.imageUrl, (value) =>
                      update(section.id, { imageUrl: value }),
                    )}

                    <label className="flex cursor-pointer items-center gap-2 self-end rounded-full border border-[#dbe6ee] px-4 py-2.5 text-xs font-bold text-[#3E155C]">
                      <ImagePlus size={15} />
                      {uploading ? "Uploading…" : "Replace image"}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={uploading}
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file) void uploadImage(file, section.id);
                          event.currentTarget.value = "";
                        }}
                      />
                    </label>

                    {field("Link URL", section.linkUrl, (value) =>
                      update(section.id, { linkUrl: value }),
                    )}
                    {field("Button label", section.buttonLabel, (value) =>
                      update(section.id, { buttonLabel: value }),
                    )}
                    {field("Sort order", String(section.sortOrder), (value) =>
                      update(section.id, { sortOrder: Number(value) || 0 }),
                    )}

                    <label className="block">
                      <span className="mb-1.5 block text-xs font-bold text-slate-600">
                        Type
                      </span>
                      <select
                        value={section.type}
                        onChange={(event) =>
                          update(section.id, {
                            type: event.target.value as HomepageSectionType,
                          })
                        }
                        className="w-full rounded-[12px] border border-slate-200 bg-white px-3 py-2.5 text-sm"
                      >
                        <option value="hero">Hero</option>
                        <option value="banner">Banner</option>
                        <option value="text">Text</option>
                        <option value="link">Link</option><option value="categories">Category section</option><option value="products">Product section</option><option value="collection">Custom collection</option>
                      </select>
                    </label>

                    <label className="flex items-center gap-2 self-end pb-2 text-xs font-bold text-slate-600">
                      <input
                        type="checkbox"
                        checked={section.isActive}
                        onChange={(event) =>
                          update(section.id, {
                            isActive: event.target.checked,
                          })
                        }
                      />
                      Active
                    </label>
                  </div>

                  <CommercePageFields section={section} onChange={patch=>update(section.id,patch)}/><HomepageSourceFields section={section} onChange={patch=>update(section.id,patch)}/>
                  {section.imageUrl ? (
                    <img
                      src={section.imageUrl}
                      alt="Section preview"
                      className="mt-4 h-32 w-full rounded-[12px] object-cover"
                    />
                  ) : null}

                  <div className="mt-4 flex flex-wrap justify-end gap-2">
                    <button disabled={saving} onClick={() => void save(section)} className="inline-flex items-center gap-2 rounded-full border border-[#dbe6ee] px-4 py-2 text-xs font-bold text-[#3E155C] disabled:opacity-50">
                      <Save size={14} /> Save draft
                    </button>
                    {section.status !== "published" && <button disabled={saving||!publication} onClick={() => void publish(section)} className="inline-flex items-center gap-2 rounded-full bg-[#62298E] px-4 py-2 text-xs font-bold text-white disabled:opacity-50">Publish now</button>}
                    {section.status === "published" && <button disabled={saving||!publication} onClick={() => void unpublish(section)} className="inline-flex items-center gap-2 rounded-full border border-amber-200 px-4 py-2 text-xs font-bold text-amber-700 disabled:opacity-50">Unpublish</button>}
                    {section.status !== "published" && <button disabled={saving || scheduling === section.id} onClick={() => void schedule(section)} className="inline-flex items-center gap-2 rounded-full border border-[#dbe6ee] px-4 py-2 text-xs font-bold text-[#3E155C] disabled:opacity-50"><CalendarClock size={14} /> {scheduling === section.id ? "Scheduling…" : "Schedule"}</button>}
                    <button onClick={() => void remove(section.id)} className="inline-flex items-center gap-2 rounded-full border border-[#f0cbd7] px-4 py-2 text-xs font-bold text-[#bd1d52]"><Trash2 size={14} /> Delete</button>
                  </div>
                </article>
              ))
            )}
          </div>
        )}
      </div>
    </main>
  );
}
