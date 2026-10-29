"use client";

import { useEffect, useMemo, useState } from "react";
import {VisualMediaEditor} from './VisualMediaEditor';
import { auth } from "@/lib/firebase";
import { departmentIds } from "@aarvika/catalogue/admin-contracts";

type TaxonomyType = "categories" | "occasions" | "recipients" | "collections";

type Item = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  sortOrder: number;
  active: boolean;
  parentId?: string | null;
  departmentId?: string;
  furnitureSector?: string;
  level?: number;
};

type FormState = {
  name: string;
  slug: string;
  description: string;
  image: string;
  sortOrder: string;
  parentId: string;
  departmentId: string;
  furnitureSector: string;
};

const EMPTY_FORM: FormState = {
  name: "",
  slug: "",
  description: "",
  image: "",
  sortOrder: "0",
  parentId: "",
  departmentId: "",
  furnitureSector: "",
};

async function api<T = unknown>(path: string, init?: RequestInit): Promise<T> {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("Please sign in again.");
  }

  const token = await user.getIdToken(true);
  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init?.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      typeof data?.error === "string" ? data.error : "Request failed.",
    );
  }

  return data as T;
}

function slugify(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

export default function TaxonomyManager({
  type,
  title,
}: {
  type: TaxonomyType;
  title: string;
}) {
  const [items, setItems] = useState<Item[]>([]);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [editing, setEditing] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [visibleCount, setVisibleCount] = useState(20);
  const [parentQuery, setParentQuery] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "archived">("all");

  async function load() {
    try {
      setError("");
      const data = await api<Item[]>(`/api/admin/${type}`);
      setItems(Array.isArray(data) ? data : []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load records.");
    }
  }

  useEffect(() => {
    void Promise.resolve().then(() => load());
  }, [type]);

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return [...items]
      .filter((item) => {
        if (statusFilter === "active") return item.active;
        if (statusFilter === "archived") return !item.active;
        return true;
      })
      .filter((item) => {
        if (!normalizedQuery) return true;
        return [item.name, item.slug, item.description || ""]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);
      })
      .sort((a, b) => {
        const order = Number(a.sortOrder || 0) - Number(b.sortOrder || 0);
        return order || a.name.localeCompare(b.name);
      });
  }, [items, query, statusFilter]);

  const activeCount = items.filter((item) => item.active).length;
  const archivedCount = items.length - activeCount;

  function reset() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setError("");
  }

  function edit(item: Item) {
    setEditing(item.id);
    setForm({
      name: item.name,
      slug: item.slug,
      description: item.description || "",
      image: item.image || "",
      sortOrder: String(item.sortOrder ?? 0),
      parentId: item.parentId || "",
      departmentId: item.departmentId || "",
      furnitureSector: item.furnitureSector || "",
    });
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.name.trim()) {
      setError("Name is required.");
      return;
    }

    setBusy(true);
    setError("");

    try {
      const payload = {
        name: form.name.trim(),
        slug: slugify(form.slug || form.name),
        description: form.description.trim(),
        image: form.image.trim(),
        sortOrder: Math.max(0, Number(form.sortOrder) || 0),
        active: editing
          ? Boolean(items.find((item) => item.id === editing)?.active)
          : true,
        ...(type === "categories"
          ? { parentId: form.parentId, departmentId: form.departmentId || undefined, furnitureSector:form.departmentId==="furniture"?form.furnitureSector:"" }
          : {}),
      };

      const path = editing
        ? `/api/admin/${type}/${editing}`
        : `/api/admin/${type}`;

      await api(path, {
        method: editing ? "PATCH" : "POST",
        body: JSON.stringify(payload),
      });

      reset();
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Save failed.");
    } finally {
      setBusy(false);
    }
  }

  async function archive(id: string) {
    if (!window.confirm(`Archive this ${title.toLowerCase().replace(/s$/, "")}?`)) {
      return;
    }

    setBusy(true);
    setError("");

    try {
      await api(`/api/admin/${type}/${id}`, { method: "DELETE" });
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Archive failed.");
    } finally {
      setBusy(false);
    }
  }

  async function restore(item: Item) {
    setBusy(true);
    setError("");

    try {
      await api(`/api/admin/${type}/${item.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: item.name,
          slug: item.slug,
          description: item.description || "",
          image: item.image || "",
          sortOrder: item.sortOrder || 0,
          active: true,
          ...(type === "categories"
            ? { parentId: item.parentId || "", departmentId: item.departmentId, furnitureSector:item.furnitureSector||"" }
            : {}),
        }),
      });
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Restore failed.");
    } finally {
      setBusy(false);
    }
  }

  async function move(item: Item, direction: -1 | 1) {
    const ordered = [...items].sort(
      (a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0),
    );
    const index = ordered.findIndex((candidate) => candidate.id === item.id);
    const target = ordered[index + direction];

    if (!target) return;
    if(Number(item.sortOrder??0)===Number(target.sortOrder??0)){setError("These entries share a sort position. Edit their Sort order values before using the move arrows.");return;}

    setBusy(true);
    setError("");

    try {
      await Promise.all([
        api(`/api/admin/${type}/${item.id}`, {
          method: "PATCH",
          body: JSON.stringify({
            name: item.name,
            slug: item.slug,
            description: item.description || "",
            image: item.image || "",
            sortOrder: target.sortOrder || 0,
            active: item.active,
            ...(type === "categories"
              ? { parentId: item.parentId || "", departmentId: item.departmentId, furnitureSector:item.furnitureSector||"" }
              : {}),
          }),
        }),
        api(`/api/admin/${type}/${target.id}`, {
          method: "PATCH",
          body: JSON.stringify({
            name: target.name,
            slug: target.slug,
            description: target.description || "",
            image: target.image || "",
            sortOrder: item.sortOrder || 0,
            active: target.active,
            ...(type === "categories"
              ? { parentId: target.parentId || "", departmentId: target.departmentId, furnitureSector:target.furnitureSector||"" }
              : {}),
          }),
        }),
      ]);

      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to reorder records.");
    } finally {
      setBusy(false);
    }
  }

  const orderedItems = useMemo(
    () => [...items].sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0)),
    [items],
  );

  const invalidParentIds = useMemo(() => {
    if (type !== "categories" || !editing) return new Set<string>();
    const invalid = new Set<string>([editing]);
    let changed = true;
    while (changed) {
      changed = false;
      for (const item of items) {
        if (item.parentId && invalid.has(item.parentId) && !invalid.has(item.id)) {
          invalid.add(item.id);
          changed = true;
        }
      }
    }
    return invalid;
  }, [editing, items, type]);

  const parentOptions = type === "categories"
    ? items.filter((item) => item.active && !invalidParentIds.has(item.id) && (!form.departmentId || item.departmentId===form.departmentId) && (!item.level || item.level<3) && item.name.toLowerCase().includes(parentQuery.toLowerCase()))
    : [];

  return (
    <main className="min-h-screen bg-[#fffafd] px-4 py-6 md:px-8 md:py-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#62298E]">
              Catalog management
            </p>
            <h1 className="gift-heading mt-1 text-3xl font-bold text-[#3E155C]">
              {title}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Manage live catalog taxonomy used by the product editor and storefront.
            </p>
          </div>

          <a
            href="/admin/products"
            className="rounded-full border border-[#3E155C]/25 bg-white px-4 py-2 text-sm font-semibold text-[#3E155C] transition hover:border-[#3E155C]"
          >
            Back to Products
          </a>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-[14px] border border-slate-100 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Total</p>
            <p className="mt-1 text-2xl font-bold text-[#3E155C]">{items.length}</p>
          </div>
          <div className="rounded-[14px] border border-slate-100 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Active</p>
            <p className="mt-1 text-2xl font-bold text-[#3E155C]">{activeCount}</p>
          </div>
          <div className="rounded-[14px] border border-slate-100 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Archived</p>
            <p className="mt-1 text-2xl font-bold text-[#bd1d52]">{archivedCount}</p>
          </div>
        </div>

        {error && (
          <div className="mt-5 rounded-[14px] border border-[#f0b8c9] bg-[#fff5f8] px-4 py-3 text-sm font-medium text-[#9f1748]">
            {error}
          </div>
        )}

        <div className="mt-6 grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
          <form
            onSubmit={submit}
            className="h-fit rounded-[14px] border border-[#f0dfe6] bg-white p-5 shadow-sm"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-[#62298E]">
                  {editing ? "Update record" : "New record"}
                </p>
                <h2 className="gift-heading mt-1 text-xl font-bold text-[#3E155C]">
                  {editing ? `Edit ${title.slice(0, -1)}` : `Add ${title.slice(0, -1)}`}
                </h2>
              </div>
              {editing && (
                <button
                  type="button"
                  onClick={reset}
                  className="text-sm font-semibold text-slate-500 hover:text-[#3E155C]"
                >
                  Cancel
                </button>
              )}
            </div>

            <div className="mt-5 space-y-4">
              <label className="block text-sm font-semibold text-slate-700">
                Name <span className="text-[#62298E]">*</span>
                <input
                  required
                  value={form.name}
                  onChange={(event) => updateField("name", event.target.value)}
                  placeholder={`e.g. ${type === "categories" ? "Birthday Gifts" : type === "occasions" ? "Birthday" : type === "recipients" ? "For Her" : "Premium Gifts"}`}
                  className="mt-1.5 w-full rounded-[12px] border border-slate-200 px-3 py-2.5 outline-none transition focus:border-[#3E155C] focus:ring-2 focus:ring-[#3E155C]/10"
                />
              </label>

              <label className="block text-sm font-semibold text-slate-700">
                Slug
                <input
                  value={form.slug}
                  onChange={(event) => updateField("slug", event.target.value)}
                  placeholder="Auto-generated if left empty"
                  className="mt-1.5 w-full rounded-[12px] border border-slate-200 px-3 py-2.5 outline-none transition focus:border-[#3E155C] focus:ring-2 focus:ring-[#3E155C]/10"
                />
              </label>

              {type === "categories" && <><label className="block text-sm font-semibold text-slate-700">Mobile department<select aria-label="Mobile department" value={form.departmentId} onChange={e=>{updateField("departmentId",e.target.value);updateField("parentId","");}} className="mt-1.5 w-full rounded-[12px] border border-slate-200 bg-white px-3 py-2.5"><option value="">Legacy / Lifestyle (preserved)</option>{departmentIds.map(id=><option key={id} value={id}>{id.replaceAll("-"," ")}</option>)}</select></label><label className="block text-sm font-semibold text-slate-700">Find parent category<input value={parentQuery} onChange={e=>setParentQuery(e.target.value)} className="mt-1.5 w-full rounded-[12px] border border-slate-200 px-3 py-2.5"/></label></>}
              {type==="categories"&&form.departmentId==="furniture"&&<label className="block text-sm font-semibold text-slate-700">Furniture sector<select value={form.furnitureSector} onChange={e=>updateField("furnitureSector",e.target.value)} className="mt-1.5 w-full rounded-[12px] border border-slate-200 bg-white px-3 py-2.5"><option value="">Not specified / inherited</option><option value="Home">Home</option><option value="Commercial">Commercial</option></select></label>}
              {type === "categories" && (
                <label className="block text-sm font-semibold text-slate-700">
                  Parent category
                  <select
                    value={form.parentId}
                    onChange={(event) => updateField("parentId", event.target.value)}
                    className="mt-1.5 w-full rounded-[12px] border border-slate-200 bg-white px-3 py-2.5 outline-none focus:border-[#3E155C] focus:ring-2 focus:ring-[#3E155C]/10"
                  >
                    <option value="">Top-level category</option>
                    {parentOptions.map((item) => (
                      <option key={item.id} value={item.id}>{item.name}</option>
                    ))}
                  </select>
                </label>
              )}

              <label className="block text-sm font-semibold text-slate-700">
                Description
                <textarea
                  value={form.description}
                  onChange={(event) => updateField("description", event.target.value)}
                  rows={4}
                  placeholder="Short description used by catalog/admin surfaces"
                  className="mt-1.5 w-full resize-y rounded-[12px] border border-slate-200 px-3 py-2.5 outline-none focus:border-[#3E155C] focus:ring-2 focus:ring-[#3E155C]/10"
                />
              </label>

              <label className="block text-sm font-semibold text-slate-700">
                Image URL
                <input
                  value={form.image}
                  onChange={(event) => updateField("image", event.target.value)}
                  placeholder="Optional taxonomy image"
                  className="mt-1.5 w-full rounded-[12px] border border-slate-200 px-3 py-2.5 outline-none focus:border-[#3E155C] focus:ring-2 focus:ring-[#3E155C]/10"
                />
              </label>

              <label className="block text-sm font-semibold text-slate-700">
                Display order
                <input
                  type="number"
                  min="0"
                  value={form.sortOrder}
                  onChange={(event) => updateField("sortOrder", event.target.value)}
                  className="mt-1.5 w-full rounded-[12px] border border-slate-200 px-3 py-2.5 outline-none focus:border-[#3E155C] focus:ring-2 focus:ring-[#3E155C]/10"
                />
              </label>
            </div>

            {editing&&(type==='categories'||type==='collections')&&<VisualMediaEditor key={editing} type={type} id={editing}/>}
            {editing&&type==='categories'&&<a className="mt-3 inline-block text-xs font-bold text-[#62298E] underline" href={'/admin/merchandising/categories?categoryId='+encodeURIComponent(editing)}>Edit this category page: banners and featured selections</a>}
            <button
              type="submit"
              disabled={busy}
              className="mt-5 w-full rounded-full bg-[#62298E] px-5 py-2.5 font-semibold text-white transition hover:bg-[#3E155C] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? "Saving…" : editing ? "Save changes" : `Create ${title.slice(0, -1)}`}
            </button>
          </form>

          <section className="min-w-0 rounded-[14px] border border-[#f0dfe6] bg-white shadow-sm">
            <div className="border-b border-slate-100 p-4 md:p-5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="gift-heading text-xl font-bold text-[#3E155C]">All {title}</h2>
                  <p className="mt-1 text-xs text-slate-500">{filteredItems.length} record{filteredItems.length === 1 ? "" : "s"} shown</p>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder={`Search ${title.toLowerCase()}…`}
                    className="w-full rounded-full border border-slate-200 px-4 py-2 text-sm outline-none focus:border-[#3E155C] sm:w-64"
                  />
                  <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm outline-none focus:border-[#3E155C]"
                  >
                    <option value="all">All status</option>
                    <option value="active">Active</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {filteredItems.slice(0,visibleCount).map((item) => (
                <article key={item.id} className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between md:p-5">
                  <div className="flex min-w-0 items-center gap-3">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt=""
                        className="h-12 w-12 shrink-0 rounded-[10px] border border-slate-100 object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[10px] bg-[#f5fbff] text-sm font-bold text-[#3E155C]">
                        {item.name.slice(0, 1).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate font-semibold text-[#3E155C]">{item.name}</h3>
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${item.active ? "bg-[#eef8f3] text-[#18794e]" : "bg-slate-100 text-slate-500"}`}>
                          {item.active ? "Active" : "Archived"}
                        </span>
                      </div>
                      <p className="mt-1 truncate text-xs text-slate-500">/{item.slug}</p>
                      {item.description && <p className="mt-1 line-clamp-1 text-xs text-slate-400">{item.description}</p>}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 md:justify-end">
                    <span className="mr-1 text-xs font-semibold text-slate-400">Order {item.sortOrder ?? 0}</span>
                    <button type="button" disabled={busy || orderedItems.findIndex((candidate) => candidate.id === item.id) === 0} onClick={() => void move(item, -1)} className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 disabled:cursor-not-allowed disabled:opacity-35">↑</button>
                    <button type="button" disabled={busy || orderedItems.findIndex((candidate) => candidate.id === item.id) === orderedItems.length - 1} onClick={() => void move(item, 1)} className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 disabled:cursor-not-allowed disabled:opacity-35">↓</button>
                    <button type="button" disabled={busy} onClick={() => edit(item)} className="rounded-full border border-[#3E155C]/25 px-3.5 py-1.5 text-xs font-semibold text-[#3E155C]">Edit</button>
                    {item.active ? (
                      <button type="button" disabled={busy} onClick={() => void archive(item.id)} className="rounded-full border border-[#f0b8c9] px-3.5 py-1.5 text-xs font-semibold text-[#bd1d52]">Archive</button>
                    ) : (
                      <button type="button" disabled={busy} onClick={() => void restore(item)} className="rounded-full border border-[#b9d9c9] px-3.5 py-1.5 text-xs font-semibold text-[#18794e]">Restore</button>
                    )}
                  </div>
                </article>
              ))}

              {filteredItems.length>visibleCount && <button type="button" onClick={()=>setVisibleCount(n=>n+20)} className="m-4 rounded-full border px-4 py-2 text-sm">Show 20 more ({filteredItems.length-visibleCount} remaining)</button>}
              {filteredItems.length === 0 && (
                <div className="px-5 py-16 text-center">
                  <p className="font-semibold text-[#3E155C]">No {title.toLowerCase()} found</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {query || statusFilter !== "all" ? "Try changing the search or status filter." : `Create your first ${title.slice(0, -1).toLowerCase()} to start building the catalog.`}
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
