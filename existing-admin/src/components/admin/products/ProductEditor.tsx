"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { blankAuthoring, type AuthoringFields } from "@aarvika/catalogue/admin-contracts";
import type { DepartmentId } from "@aarvika/catalogue/departments";
import { AuthoringPanel, VariantStockFields } from "./AuthoringPanel";
import { DepartmentFields } from "./DepartmentFields";
import { ProductPreview } from "./ProductPreview";

type TaxonomyItem = {
  id: string;
  name: string;
  slug?: string;
  active?: boolean;
  sortOrder?: number;
  parentId?: string | null;
  departmentId?: DepartmentId;
  level?: number;
};

type MerchandisingItem = {
  id: string;
  type: "culture" | "state";
  name: string;
  active: boolean;
  sortOrder: number;
};

type ProductImage = {
  url: string;
  alt?: string;
  fileId?: string;
  filePath?: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
};

type ProductVariant = {
  id?: string;
  attributes?: Record<string, string>;
  quantity?: number;
  name: string;
  value: string;
  price?: number;
  sku?: string;
};

type Personalization = {
  enabled: boolean;
  fields: string[];
  maxCharacters: number;
  imageUpload: boolean;
};

type Product = {
  aarvika?: AuthoringFields;
  sku: string;
  title: string;
  slug: string;
  shortDescription: string;
  description: string;

  categoryIds: string[];
  occasionIds: string[];
  recipientIds: string[];
  tagIds: string[];
  collectionIds: string[];
  cultureTagIds: string[];
  stateTagIds: string[];

  images: ProductImage[];
  thumbnail: string;

  price: number;
  mrp: number;
  discount: number;

  variants: ProductVariant[];

  personalization: Personalization;

  inventory: {
    quantity: number;
    reserved: number;
    sold: number;
  };

  delivery: {
    minDays: number;
    maxDays: number;
    sameDay: boolean;
    midnight?: boolean;
    fee?: number;
    slotFees?: Record<string, number>;
    cutoffHour?: number;
    capacityPerSlot?: number;
    zoneMode?: "legacy" | "inherit";
  };

  serviceability: {
    nationwide: boolean;
    pincodes: string[];
  };

  status: "draft" | "live" | "archived";

  featured: boolean;
  bestseller: boolean;
  newArrival: boolean;

  rating: number;
  reviewCount: number;

  seo: {
    title: string;
    description: string;
    keywords: string[];
  };
};

const blankProduct: Product = {
  aarvika: blankAuthoring(),
  sku: "",
  title: "",
  slug: "",
  shortDescription: "",
  description: "",

  categoryIds: [],
  occasionIds: [],
  recipientIds: [],
  tagIds: [],
  collectionIds: [],
  cultureTagIds: [],
  stateTagIds: [],

  images: [],
  thumbnail: "",

  price: 0,
  mrp: 0,
  discount: 0,

  variants: [],

  personalization: {
    enabled: false,
    fields: [],
    maxCharacters: 100,
    imageUpload: false,
  },

  inventory: {
    quantity: 0,
    reserved: 0,
    sold: 0,
  },

  delivery: {
    minDays: 2,
    maxDays: 5,
    sameDay: false,
    midnight: false,
    fee: 0,
    slotFees: {},
    cutoffHour: 18,
    capacityPerSlot: 0,
    zoneMode: "inherit",
  },

  serviceability: {
    nationwide: true,
    pincodes: [],
  },

  status: "draft",

  featured: false,
  bestseller: false,
  newArrival: false,

  rating: 0,
  reviewCount: 0,

  seo: {
    title: "",
    description: "",
    keywords: [],
  },
};

async function api(path: string, init?: RequestInit) {
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
    throw new Error(data.error || "Request failed.");
  }

  return data;
}

function normalizeProduct(value: Partial<Product>): Product {
  return {
    ...blankProduct,
    ...value,
    aarvika: value.aarvika,

    categoryIds: Array.isArray(value.categoryIds)
      ? value.categoryIds
      : [],

    occasionIds: Array.isArray(value.occasionIds)
      ? value.occasionIds
      : [],

    recipientIds: Array.isArray(value.recipientIds)
      ? value.recipientIds
      : [],

    tagIds: Array.isArray(value.tagIds)
      ? value.tagIds
      : [],

    collectionIds: Array.isArray(value.collectionIds)
      ? value.collectionIds
      : [],

    cultureTagIds: Array.isArray(value.cultureTagIds)
      ? value.cultureTagIds
      : [],

    stateTagIds: Array.isArray(value.stateTagIds)
      ? value.stateTagIds
      : [],

    images: Array.isArray(value.images)
      ? value.images
      : [],

    variants: Array.isArray(value.variants)
      ? value.variants
      : [],

    personalization: {
      ...blankProduct.personalization,
      ...(value.personalization || {}),
      maxCharacters:
        typeof value.personalization?.maxCharacters === "number"
          ? value.personalization.maxCharacters
          : typeof (value.personalization as unknown as { maxLength?: unknown } | undefined)?.maxLength === "number"
            ? Number((value.personalization as unknown as { maxLength: number }).maxLength)
            : blankProduct.personalization.maxCharacters,
      fields: Array.isArray(value.personalization?.fields)
        ? value.personalization.fields
        : [],
    },

    inventory: {
      ...blankProduct.inventory,
      ...(value.inventory || {}),
    },

    delivery: {
      ...blankProduct.delivery,
      ...(value.delivery || {}),
    },

    serviceability: {
      ...blankProduct.serviceability,
      ...(value.serviceability || {}),
      pincodes: Array.isArray(value.serviceability?.pincodes)
        ? value.serviceability.pincodes
        : [],
    },

    seo: {
      ...blankProduct.seo,
      ...(value.seo || {}),
      keywords: Array.isArray(value.seo?.keywords)
        ? value.seo.keywords
        : [],
    },
  };
}

export default function ProductEditor({
  productId,
}: {
  productId?: string;
}) {
  const router = useRouter();

  const [product, setProduct] = useState<Product>(blankProduct);
  const [savedSnapshot, setSavedSnapshot] = useState(JSON.stringify(blankProduct));
  const [previewOpen, setPreviewOpen] = useState(false);
  const [imagePath, setImagePath] = useState("");
  const dirty = JSON.stringify(product) !== savedSnapshot;
  useEffect(() => {
    if (!dirty) return;
    let approved=false;
    const confirmLeave=()=>approved||(approved=window.confirm("Leave without saving product changes?"));
    const beforeUnload = (event: BeforeUnloadEvent) => { if(!approved){event.preventDefault(); event.returnValue = "";} };
    const leave = (event: MouseEvent) => { const link = (event.target as Element)?.closest?.("a[href]"); if (link && !event.metaKey&&!event.ctrlKey&&!event.shiftKey&&!event.altKey&&event.button===0&&link.getAttribute("target")!=="_blank"&&!link.hasAttribute("download")&&!link.getAttribute("href")?.startsWith("#") && !confirmLeave()) { event.preventDefault(); event.stopPropagation(); } };
    const navigation=(window as unknown as {navigation?:EventTarget}).navigation;
    const traverse=(event:Event)=>{const next=event as Event&{navigationType?:string;destination?:{sameDocument?:boolean;url?:string}};if(next.navigationType==='traverse'&&next.destination?.sameDocument&&next.cancelable&&!confirmLeave())next.preventDefault();};
    const signOut=(event:Event)=>{if(!confirmLeave())event.preventDefault();};
    window.addEventListener("aarvika:before-admin-signout",signOut);
    navigation?.addEventListener("navigate",traverse);
    window.addEventListener("beforeunload", beforeUnload); document.addEventListener("click", leave, true);
    return () => { window.removeEventListener("aarvika:before-admin-signout",signOut);navigation?.removeEventListener("navigate",traverse); window.removeEventListener("beforeunload", beforeUnload); document.removeEventListener("click", leave, true); };
  }, [dirty,product]);

  const [categories, setCategories] = useState<TaxonomyItem[]>([]);
  const [occasions, setOccasions] = useState<TaxonomyItem[]>([]);
  const [recipients, setRecipients] = useState<TaxonomyItem[]>([]);
  const [collections, setCollections] = useState<TaxonomyItem[]>([]);
  const [cultures, setCultures] = useState<TaxonomyItem[]>([]);
  const [states, setStates] = useState<TaxonomyItem[]>([]);

  const [uploading, setUploading] = useState(false);
  const [removedImageFileIds, setRemovedImageFileIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [variantName, setVariantName] = useState("");
  const [variantValue, setVariantValue] = useState("");
  const [variantPrice, setVariantPrice] = useState("");
  const [variantSku, setVariantSku] = useState("");

  const [tagInput, setTagInput] = useState("");
  const [personalizationField, setPersonalizationField] =
    useState("");
  const [pincodeInput, setPincodeInput] = useState("");
  const [keywordInput, setKeywordInput] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [
          categoryData,
          occasionData,
          recipientData,
          collectionData,
        ] = await Promise.all([
          api("/api/admin/categories"),
          api("/api/admin/occasions"),
          api("/api/admin/recipients"),
          api("/api/admin/collections"),
        ]);

        if (cancelled) {
          return;
        }

        setCategories(categoryData);
        setOccasions(occasionData);
        setRecipients(recipientData);
        setCollections(collectionData);

        try {
          const merchandisingData = (await api(
            "/api/admin/merchandising/wedding",
          )) as { items: MerchandisingItem[] };
          if (!cancelled) {
            setCultures(
              merchandisingData.items
                .filter((item) => item.type === "culture" && item.active)
                .sort((a, b) => a.sortOrder - b.sortOrder),
            );
            setStates(
              merchandisingData.items
                .filter((item) => item.type === "state" && item.active)
                .sort((a, b) => a.sortOrder - b.sortOrder),
            );
          }
        } catch {
          if (!cancelled) {
            setCultures([]);
            setStates([]);
          }
        }

        if (productId) {
          const productData = await api(
            `/api/admin/products/${productId}`,
          );

          if (!cancelled) {
            const normalized = normalizeProduct(productData);
            setProduct(normalized);
            setSavedSnapshot(JSON.stringify(normalized));
          }
        }
      } catch (cause) {
        if (!cancelled) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Unable to load product data.",
          );
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [productId]);

  const categoryDisplayItems = useMemo(() => {
    const byId = new Map(categories.map((item) => [item.id, item]));

    const labelFor = (item: TaxonomyItem) => {
      const names = [item.name];
      const visited = new Set<string>([item.id]);
      let parentId = item.parentId;

      while (parentId && !visited.has(parentId)) {
        visited.add(parentId);
        const parent = byId.get(parentId);
        if (!parent) break;
        names.unshift(parent.name);
        parentId = parent.parentId;
      }

      return names.join(" › ");
    };

    return [...categories]
      .sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0) || a.name.localeCompare(b.name))
      .map((item) => ({ ...item, name: labelFor(item) }));
  }, [categories]);

  const taxonomyGroups = useMemo(
    () => [
      {
        key: "categoryIds" as const,
        label: "Categories",
        items: categoryDisplayItems,
      },
      {
        key: "occasionIds" as const,
        label: "Occasions",
        items: occasions,
      },
      {
        key: "recipientIds" as const,
        label: "Recipients",
        items: recipients,
      },
      {
        key: "collectionIds" as const,
        label: "Collections",
        items: collections,
      },
    ],
    [categoryDisplayItems, occasions, recipients, collections],
  );

  function setField<K extends keyof Product>(
    key: K,
    value: Product[K],
  ) {
    setProduct((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function updateNested<
    K extends "inventory" | "delivery" | "serviceability" | "personalization" | "seo",
  >(
    key: K,
    value: Product[K],
  ) {
    setProduct((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function toggleTaxonomy(
    key:
      | "categoryIds"
      | "occasionIds"
      | "recipientIds"
      | "collectionIds",
    id: string,
  ) {
    setProduct((current) => ({
      ...current,
      [key]: current[key].includes(id)
        ? current[key].filter((value) => value !== id)
        : [...current[key], id],
    }));
  }

  function toggleMerchandisingTag(key: "cultureTagIds" | "stateTagIds", id: string) {
    setProduct((current) => ({
      ...current,
      [key]: current[key].includes(id)
        ? current[key].filter((value) => value !== id)
        : [...current[key], id],
    }));
  }

  function addTag() {
    const value = tagInput.trim();

    if (!value || product.tagIds.includes(value)) {
      return;
    }

    setProduct((current) => ({
      ...current,
      tagIds: [...current.tagIds, value],
    }));

    setTagInput("");
  }

  function removeTag(value: string) {
    setProduct((current) => ({
      ...current,
      tagIds: current.tagIds.filter((tag) => tag !== value),
    }));
  }

  function addVariant() {
    const name = variantName.trim();
    const value = variantValue.trim();

    if (!name || !value) {
      return;
    }

    const variant: ProductVariant = {
      id: crypto.randomUUID(),
      ...(product.aarvika ? { quantity: 0 } : {}),
      name,
      value,
      ...(variantPrice.trim()
        ? { price: Number(variantPrice) }
        : {}),
      ...(variantSku.trim()
        ? { sku: variantSku.trim() }
        : {}),
    };

    setProduct((current) => ({
      ...current,
      variants: [...current.variants, variant],
    }));

    setVariantName("");
    setVariantValue("");
    setVariantPrice("");
    setVariantSku("");
  }

  function removeVariant(index: number) {
    setProduct((current) => ({
      ...current,
      variants: current.variants.filter(
        (_, variantIndex) => variantIndex !== index,
      ),
    }));
  }

  function addPersonalizationField() {
    const value = personalizationField.trim();

    if (
      !value ||
      product.personalization.fields.includes(value)
    ) {
      return;
    }

    updateNested("personalization", {
      ...product.personalization,
      fields: [
        ...product.personalization.fields,
        value,
      ],
    });

    setPersonalizationField("");
  }

  function removePersonalizationField(value: string) {
    updateNested("personalization", {
      ...product.personalization,
      fields: product.personalization.fields.filter(
        (field) => field !== value,
      ),
    });
  }

  function addPincode() {
    const value = pincodeInput.trim();

    if (!value || product.serviceability.pincodes.includes(value)) {
      return;
    }

    updateNested("serviceability", {
      ...product.serviceability,
      pincodes: [
        ...product.serviceability.pincodes,
        value,
      ],
    });

    setPincodeInput("");
  }

  function removePincode(value: string) {
    updateNested("serviceability", {
      ...product.serviceability,
      pincodes: product.serviceability.pincodes.filter(
        (pincode) => pincode !== value,
      ),
    });
  }

  function addKeyword() {
    const value = keywordInput.trim();

    if (!value || product.seo.keywords.includes(value)) {
      return;
    }

    updateNested("seo", {
      ...product.seo,
      keywords: [...product.seo.keywords, value],
    });

    setKeywordInput("");
  }

  function removeKeyword(value: string) {
    updateNested("seo", {
      ...product.seo,
      keywords: product.seo.keywords.filter(
        (keyword) => keyword !== value,
      ),
    });
  }

  function setPrimaryImage(index: number) {
    const image = product.images[index];

    if (!image) {
      return;
    }

    setProduct((current) => ({
      ...current,
      thumbnail: image.url,
    }));
  }

  function moveImage(index: number, direction: -1 | 1) {
    setProduct((current) => {
      const nextIndex = index + direction;

      if (nextIndex < 0 || nextIndex >= current.images.length) {
        return current;
      }

      const images = [...current.images];
      const [moved] = images.splice(index, 1);
      images.splice(nextIndex, 0, moved);

      return {
        ...current,
        images,
      };
    });
  }

  function removeImage(index: number) {
    setProduct((current) => {
      const removed = current.images[index];
      const images = current.images.filter(
        (_, imageIndex) => imageIndex !== index,
      );

      return {
        ...current,
        images,
        thumbnail:
          current.thumbnail === removed?.url
            ? images[0]?.url || ""
            : current.thumbnail,
      };
    });

    const removed = product.images[index];

    if (removed?.fileId) {
      setRemovedImageFileIds((current) =>
        current.includes(removed.fileId as string)
          ? current
          : [...current, removed.fileId as string],
      );
    }
  }

  async function uploadImage(file: File) {
    setUploading(true);
    setError("");

    try {
      const user = auth.currentUser;

      if (!user) {
        throw new Error("Please sign in again.");
      }

      const token = await user.getIdToken(true);

      const form = new FormData();

      form.append("file", file);
      form.append("fileName", file.name);

      const response = await fetch(
        product.aarvika && process.env.NEXT_PUBLIC_AARVIKA_SHARED !== 'true' ? "/api/admin/uploads/demo-product" : "/api/admin/uploads/imagekit",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: form,
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Image upload failed.",
        );
      }

      if (typeof data.url !== "string" || !data.url) {
        throw new Error("Image upload did not return an image URL.");
      }

      setProduct((current) => ({
        ...current,
        images: [
          ...current.images,
          {
            url: data.url,
            alt: current.title,
            fileId:
              typeof data.fileId === "string"
                ? data.fileId
                : undefined,
            filePath:
              typeof data.filePath === "string"
                ? data.filePath
                : undefined,
            thumbnailUrl:
              typeof data.thumbnailUrl === "string"
                ? data.thumbnailUrl
                : data.url,
            width:
              typeof data.width === "number"
                ? data.width
                : undefined,
            height:
              typeof data.height === "number"
                ? data.height
                : undefined,
          },
        ],
        thumbnail: current.thumbnail || data.url,
      }));
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Image upload failed.",
      );
    } finally {
      setUploading(false);
    }
  }

  async function save(event: React.SyntheticEvent, asDraft = false) {
    event.preventDefault();

    setBusy(true);
    setError("");

    try {
      const path = productId
        ? `/api/admin/products/${productId}`
        : "/api/admin/products";

      await api(path, {
        method: productId ? "PATCH" : "POST",
        body: JSON.stringify(asDraft ? { ...product, status: "draft" } : product),
      });

      if (removedImageFileIds.length > 0) {
        const results = await Promise.allSettled(
          removedImageFileIds.map(async (fileId) => {
            const user = auth.currentUser;

            if (!user) {
              throw new Error("Please sign in again.");
            }

            const token = await user.getIdToken(true);
            const response = await fetch(
              "/api/admin/uploads/imagekit",
              {
                method: "DELETE",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ fileId }),
              },
            );

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
              throw new Error(
                data.error ||
                  "Unable to remove the ImageKit asset.",
              );
            }
          }),
        );

        const failedDeletes = results.filter(
          (result) => result.status === "rejected",
        );

        if (failedDeletes.length > 0) {
          console.warn(
            "Some removed product images could not be deleted from ImageKit.",
            failedDeletes,
          );
        }
      }

      setSavedSnapshot(JSON.stringify(product));
      router.push("/admin/products");
      router.refresh();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to save product.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#fffafd] px-4 py-8 md:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#62298E]">
              Catalog
            </p>

            <h1 className="gift-heading text-3xl font-bold text-[#3E155C]">
              {productId ? "Edit Product" : "New Product"}
            </h1>
          </div>

          <a
            href="/admin/products"
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
          >
            Back
          </a>
        </header>

        <form
          onSubmit={event => { void save(event); }}
          className="mt-7 space-y-6"
        >
          <AuthoringPanel value={product.aarvika} categories={categories} categoryIds={product.categoryIds} onChange={aarvika=>setProduct(current=>({...current,aarvika}))} onCategories={categoryIds=>setProduct(current=>({...current,categoryIds}))}/>
          {/* BASIC INFORMATION */}
          <section className="rounded-[14px] border border-[#f0dfe6] bg-white p-5">
            <h2 className="gift-heading text-xl font-bold text-[#3E155C]">
              Basic information
            </h2>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {[
                ["title", "Title"],
                ["sku", "SKU"],
                ["slug", "Slug"],
              ].map(([key, label]) => (
                <label
                  key={key}
                  className="text-sm font-semibold text-slate-700"
                >
                  {label}

                  <input
                    required
                    value={
                      String(
                        product[
                          key as keyof Product
                        ] ?? "",
                      )
                    }
                    onChange={(event) =>
                      setField(
                        key as "title" | "sku" | "slug",
                        event.target.value,
                      )
                    }
                    className="mt-1 w-full rounded-[14px] border border-slate-200 px-3 py-2 outline-none focus:border-[#3E155C]"
                  />
                </label>
              ))}

              <label className="text-sm font-semibold text-slate-700 md:col-span-2">
                Short description

                <input
                  value={product.shortDescription}
                  onChange={(event) =>
                    setField(
                      "shortDescription",
                      event.target.value,
                    )
                  }
                  className="mt-1 w-full rounded-[14px] border border-slate-200 px-3 py-2 outline-none focus:border-[#3E155C]"
                />
              </label>

              <label className="text-sm font-semibold text-slate-700 md:col-span-2">
                Description

                <textarea
                  value={product.description}
                  onChange={(event) =>
                    setField(
                      "description",
                      event.target.value,
                    )
                  }
                  className="mt-1 min-h-32 w-full rounded-[14px] border border-slate-200 px-3 py-2 outline-none focus:border-[#3E155C]"
                />
              </label>
            </div>
          </section>

          {/* TAXONOMY */}
          <section className="rounded-[14px] border border-[#f0dfe6] bg-white p-5">
            <h2 className="gift-heading text-xl font-bold text-[#3E155C]">
              Taxonomy
            </h2>

            <div className="mt-4 grid gap-5 md:grid-cols-2">
              {taxonomyGroups.filter(group=>group.key!=="categoryIds"||!product.aarvika).map((group) => (
                <div key={group.key}>
                  <p className="mb-2 text-sm font-semibold text-slate-700">
                    {group.label}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {group.items.map((item) => {
                      const selected =
                        product[group.key].includes(
                          item.id,
                        );

                      return (
                        <button
                          type="button"
                          key={item.id}
                          onClick={() =>
                            toggleTaxonomy(
                              group.key,
                              item.id,
                            )
                          }
                          className={`rounded-full border px-3 py-1 text-sm font-semibold transition ${
                            selected
                              ? "border-[#62298E] bg-[#62298E] text-white"
                              : "border-slate-200 bg-white text-slate-700 hover:border-[#3E155C]"
                          }`}
                        >
                          {item.name}
                        </button>
                      );
                    })}

                    {group.items.length === 0 && (
                      <p className="text-sm text-slate-400">
                        No active items available.
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* WEDDING MERCHANDISING */}
            {(!product.aarvika||product.aarvika.departmentIds.includes("wedding"))&&<div className="mt-6 border-t border-slate-100 pt-5">
              <p className="text-sm font-semibold text-slate-700">Wedding merchandising</p>
              <p className="mt-1 text-xs text-slate-400">These references control Wedding culture and state filters. They are optional and only affect the Wedding storefront.</p>

              <div className="mt-4 grid gap-5 md:grid-cols-2">
                {[
                  { key: "cultureTagIds" as const, label: "Wedding cultures", items: cultures },
                  { key: "stateTagIds" as const, label: "Wedding states", items: states },
                ].map((group) => (
                  <div key={group.key}>
                    <p className="mb-2 text-xs font-bold text-slate-600">{group.label}</p>
                    <div className="flex flex-wrap gap-2">
                      {group.items.map((item) => {
                        const selected = product[group.key].includes(item.id);
                        return (
                          <button
                            type="button"
                            key={item.id}
                            onClick={() => toggleMerchandisingTag(group.key, item.id)}
                            className={`rounded-full border px-3 py-1 text-sm font-semibold transition ${selected ? "border-[#62298E] bg-[#62298E] text-white" : "border-slate-200 bg-white text-slate-700 hover:border-[#3E155C]"}`}
                          >
                            {item.name}
                          </button>
                        );
                      })}
                      {group.items.length === 0 && <p className="text-sm text-slate-400">No active items available.</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>}

            {/* TAGS */}
            <div className="mt-6 border-t border-slate-100 pt-5">
              <p className="text-sm font-semibold text-slate-700">
                Tags
              </p>

              <div className="mt-2 flex gap-2">
                <input
                  value={tagInput}
                  onChange={(event) =>
                    setTagInput(event.target.value)
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      addTag();
                    }
                  }}
                  placeholder="Add tag"
                  className="min-w-0 flex-1 rounded-[14px] border border-slate-200 px-3 py-2"
                />

                <button
                  type="button"
                  onClick={addTag}
                  className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold"
                >
                  Add
                </button>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {product.tagIds.map((tag) => (
                  <button
                    type="button"
                    key={tag}
                    onClick={() => removeTag(tag)}
                    className="rounded-full bg-[#f5fbff] px-3 py-1 text-sm text-[#3E155C]"
                  >
                    {tag} ×
                  </button>
                ))}
              </div>
            </div>
          </section>

          {product.aarvika&&<DepartmentFields value={product.aarvika} onChange={value=>setField("aarvika",value)}/>}

          {/* PRICING */}
          <section className="rounded-[14px] border border-[#f0dfe6] bg-white p-5">
            <h2 className="gift-heading text-xl font-bold text-[#3E155C]">
              Pricing
            </h2>

            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <label className="text-sm font-semibold">
                Price

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={product.price}
                  onChange={(event) =>
                    setField(
                      "price",
                      Number(event.target.value),
                    )
                  }
                  className="mt-1 w-full rounded-[14px] border border-slate-200 px-3 py-2"
                />
              </label>

              <label className="text-sm font-semibold">
                MRP

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={product.mrp}
                  onChange={(event) =>
                    setField(
                      "mrp",
                      Number(event.target.value),
                    )
                  }
                  className="mt-1 w-full rounded-[14px] border border-slate-200 px-3 py-2"
                />
              </label>

              <label className="text-sm font-semibold">
                Discount

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={product.discount}
                  onChange={(event) =>
                    setField(
                      "discount",
                      Number(event.target.value),
                    )
                  }
                  className="mt-1 w-full rounded-[14px] border border-slate-200 px-3 py-2"
                />
              </label>
            </div>
          </section>

          {/* VARIANTS */}
          <section className="rounded-[14px] border border-[#f0dfe6] bg-white p-5">
            <h2 className="gift-heading text-xl font-bold text-[#3E155C]">
              Variants
            </h2>

            <div className="mt-4 grid gap-3 md:grid-cols-4">
              <input
                placeholder="Name"
                value={variantName}
                onChange={(event) =>
                  setVariantName(event.target.value)
                }
                className="rounded-[14px] border border-slate-200 px-3 py-2"
              />

              <input
                placeholder="Value"
                value={variantValue}
                onChange={(event) =>
                  setVariantValue(event.target.value)
                }
                className="rounded-[14px] border border-slate-200 px-3 py-2"
              />

              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Price"
                value={variantPrice}
                onChange={(event) =>
                  setVariantPrice(event.target.value)
                }
                className="rounded-[14px] border border-slate-200 px-3 py-2"
              />

              <input
                placeholder="SKU"
                value={variantSku}
                onChange={(event) =>
                  setVariantSku(event.target.value)
                }
                className="rounded-[14px] border border-slate-200 px-3 py-2"
              />
            </div>

            <button
              type="button"
              onClick={addVariant}
              className="mt-3 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold"
            >
              Add variant
            </button>

            <div className="mt-4 space-y-2">
              {product.variants.map((variant, index) => (
                <div
                  key={`${variant.name}-${variant.value}-${index}`}
                  className="flex items-center justify-between gap-3 rounded-[14px] bg-[#f5fbff] px-4 py-3 text-sm"
                >
                  <div className="min-w-0">
                    <span className="font-semibold">
                      {variant.name}
                    </span>{" "}
                    — {variant.value}

                    {variant.price !== undefined && (
                      <span className="ml-2 text-slate-500">
                        ₹{variant.price}
                      </span>
                    )}

                    {variant.sku && (
                      <span className="ml-2 text-slate-400">
                        {variant.sku}
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      removeVariant(index)
                    }
                    className="shrink-0 text-[#bd1d52]"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* IMAGES */}
          <section className="rounded-[14px] border border-[#f0dfe6] bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="gift-heading text-xl font-bold text-[#3E155C]">
                  Product images
                </h2>
                {product.aarvika&&process.env.NEXT_PUBLIC_AARVIKA_SHARED!=='true'&&<div className="mt-4"><label className="block text-sm font-semibold">Existing demo image path<input aria-label="Demo image path" value={imagePath} onChange={e=>setImagePath(e.target.value)} placeholder="/demo-art/box.png" className="mt-1 w-full rounded-[12px] border border-slate-200 px-3 py-2"/></label><button type="button" onClick={()=>{if(!/^\/(?!\/)[a-zA-Z0-9_/.\-]+\.(png|jpe?g|webp|svg)$/i.test(imagePath)||imagePath.includes('..')){setError('Use a local demo image path ending in PNG, JPEG, WebP or SVG.');return;}setProduct(p=>({...p,images:[...p.images,{url:imagePath,alt:p.title}],thumbnail:p.thumbnail||imagePath}));setImagePath('');setError('');}} className="mt-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold">Add existing image</button></div>}
                <p className="mt-1 text-xs text-slate-500">{product.aarvika&&process.env.NEXT_PUBLIC_AARVIKA_SHARED!=='true' ? "Upload a PNG, JPEG or WebP to this local demo. The first image becomes primary." : "Upload product media directly to ImageKit. The first image becomes primary."}</p>
              </div>

              <label className="inline-flex cursor-pointer items-center rounded-full bg-[#3E155C] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#3E155C]">
                {uploading ? "Uploading…" : "Upload image"}
                <input
                  type="file"
                  accept="image/*"
                  disabled={uploading}
                  className="sr-only"
                  onChange={(event) => {
                    const file = event.target.files?.[0];

                    if (file) {
                      void uploadImage(file);
                    }

                    event.currentTarget.value = "";
                  }}
                />
              </label>
            </div>

            <div className="mt-4 rounded-[14px] border border-dashed border-[#c9dbe8] bg-[#f5fbff] p-4 text-xs text-slate-600">
              <p className="font-semibold text-[#3E155C]">{product.aarvika&&process.env.NEXT_PUBLIC_AARVIKA_SHARED!=='true' ? "Local demo media" : "ImageKit media rules"}</p>
              <p className="mt-1">{product.aarvika&&process.env.NEXT_PUBLIC_AARVIKA_SHARED!=='true' ? "Uploaded images stay on this computer and appear in the connected demo app. Cloud uploads remain disabled." : "Images upload through the authorized ImageKit server route."}</p>
            </div>

            {product.images.length === 0 ? (
              <div className="mt-4 rounded-[14px] border border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
                No product images yet. Upload at least one image before publishing the product.
              </div>
            ) : (
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {product.images.map((image, index) => {
                  const isPrimary = product.thumbnail === image.url;

                  return (
                    <div
                      key={`${image.fileId || image.url}-${index}`}
                      className={`rounded-[14px] border p-3 ${
                        isPrimary
                          ? "border-[#62298E] bg-[#fffafd]"
                          : "border-slate-200 bg-white"
                      }`}
                    >
                      <div className="flex gap-3">
                        <div
                          className="h-24 w-24 shrink-0 rounded-xl border border-slate-200 bg-slate-100 bg-cover bg-center"
                          style={{ backgroundImage: `url("${image.thumbnailUrl || image.url}")` }}
                          role="img"
                          aria-label={image.alt || `Product image ${index + 1}`}
                        />

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-bold text-[#3E155C]">
                              Image {index + 1}
                            </span>

                            {isPrimary && (
                              <span className="rounded-full bg-[#62298E] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                                Primary
                              </span>
                            )}
                          </div>

                          <p className="mt-1 truncate text-xs text-slate-500">
                            {image.filePath || image.url}
                          </p>

                          {image.width && image.height && (
                            <p className="mt-1 text-[11px] text-slate-400">
                              {image.width} × {image.height}px
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setPrimaryImage(index)}
                          disabled={isPrimary}
                          className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Make primary
                        </button>
                        <button
                          type="button"
                          onClick={() => moveImage(index, -1)}
                          disabled={index === 0}
                          className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Move left
                        </button>
                        <button
                          type="button"
                          onClick={() => moveImage(index, 1)}
                          disabled={index === product.images.length - 1}
                          className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Move right
                        </button>
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="rounded-full border border-[#f0dfe6] px-3 py-1.5 text-xs font-semibold text-[#bd1d52]"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {product.aarvika&&product.variants.length>0&&<section className="rounded-[14px] border border-[#f0dfe6] bg-white p-5"><h2 className="gift-heading text-xl font-bold text-[#3E155C]">Variant SKU prices and stock</h2><VariantStockFields variants={product.variants} onChange={(index,patch)=>setProduct(current=>({...current,variants:current.variants.map((v,i)=>i===index?{...v,...patch}:v)}))}/></section>}
          {/* INVENTORY */}
          <section className="rounded-[14px] border border-[#f0dfe6] bg-white p-5">
            <h2 className="gift-heading text-xl font-bold text-[#3E155C]">
              Inventory
            </h2>

            <div className="mt-4 grid gap-4 md:grid-cols-3">
              {(
                [
                  ["quantity", "Quantity"],
                  ["reserved", "Reserved"],
                  ["sold", "Sold"],
                ] as const
              ).map(([key, label]) => (
                <label
                  key={key}
                  className="text-sm font-semibold"
                >
                  {label}

                  <input
                    type="number"
                    min="0"
                    disabled={!!product.aarvika && (key!=="quantity" || product.variants.length>0)}
                    value={product.inventory[key]}
                    onChange={(event) =>
                      updateNested("inventory", {
                        ...product.inventory,
                        [key]: Number(
                          event.target.value,
                        ),
                      })
                    }
                    className="mt-1 w-full rounded-[14px] border border-slate-200 px-3 py-2"
                  />
                </label>
              ))}
            </div>
          </section>

          {/* DELIVERY */}
          <section className="rounded-[14px] border border-[#f0dfe6] bg-white p-5">
            <h2 className="gift-heading text-xl font-bold text-[#3E155C]">
              Delivery
            </h2>

            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <label className="flex items-center gap-2 self-end rounded-[14px] bg-[#f5fbff] p-3 text-sm font-semibold">
                <input
                  type="checkbox"
                  checked={product.delivery.zoneMode === "inherit"}
                  onChange={(event) =>
                    updateNested("delivery", {
                      ...product.delivery,
                      zoneMode: event.target.checked ? "inherit" : "legacy",
                    })
                  }
                />
                Use delivery-zone defaults
              </label>

              <label className="text-sm font-semibold">
                Minimum days

                <input
                  type="number"
                  min="0"
                  value={product.delivery.minDays}
                  onChange={(event) =>
                    updateNested("delivery", {
                      ...product.delivery,
                      minDays: Number(
                        event.target.value,
                      ),
                    })
                  }
                  className="mt-1 w-full rounded-[14px] border border-slate-200 px-3 py-2"
                />
              </label>

              <label className="text-sm font-semibold">
                Maximum days

                <input
                  type="number"
                  min="0"
                  value={product.delivery.maxDays}
                  onChange={(event) =>
                    updateNested("delivery", {
                      ...product.delivery,
                      maxDays: Number(
                        event.target.value,
                      ),
                    })
                  }
                  className="mt-1 w-full rounded-[14px] border border-slate-200 px-3 py-2"
                />
              </label>

              <label className="flex items-center gap-2 self-end rounded-[14px] bg-[#f5fbff] p-3 text-sm font-semibold">
                <input
                  type="checkbox"
                  checked={product.delivery.sameDay}
                  onChange={(event) =>
                    updateNested("delivery", {
                      ...product.delivery,
                      sameDay: event.target.checked,
                    })
                  }
                />
                Same-day delivery
              </label>

              <label className="text-sm font-semibold">
                Delivery fee
                <input type="number" min="0" value={product.delivery.fee ?? 0} onChange={(event) => updateNested("delivery", { ...product.delivery, fee: Math.max(0, Number(event.target.value)) })} className="mt-1 w-full rounded-[14px] border border-slate-200 px-3 py-2" />
              </label>

              <label className="text-sm font-semibold">
                Same-day cutoff hour (IST)
                <input type="number" min="0" max="23" value={product.delivery.cutoffHour ?? 18} onChange={(event) => updateNested("delivery", { ...product.delivery, cutoffHour: Math.min(23, Math.max(0, Number(event.target.value))) })} className="mt-1 w-full rounded-[14px] border border-slate-200 px-3 py-2" />
              </label>

              <label className="text-sm font-semibold">
                Slot capacity / day
                <input type="number" min="0" value={product.delivery.capacityPerSlot ?? 0} onChange={(event) => updateNested("delivery", { ...product.delivery, capacityPerSlot: Math.max(0, Math.floor(Number(event.target.value))) })} className="mt-1 w-full rounded-[14px] border border-slate-200 px-3 py-2" />
                <span className="mt-1 block text-[11px] font-normal text-slate-400">0 = unlimited</span>
              </label>

              <label className="flex items-center gap-2 self-end rounded-[14px] bg-[#fffafd] p-3 text-sm font-semibold">
                <input type="checkbox" checked={Boolean(product.delivery.midnight)} onChange={(event) => updateNested("delivery", { ...product.delivery, midnight: event.target.checked })} />
                Midnight slot (10 PM–12 AM)
              </label>

              <label className="text-sm font-semibold">
                Midnight slot fee
                <input type="number" min="0" value={product.delivery.slotFees?.["10 PM – 12 AM"] ?? 0} onChange={(event) => updateNested("delivery", { ...product.delivery, slotFees: { ...(product.delivery.slotFees || {}), ["10 PM – 12 AM"]: Math.max(0, Number(event.target.value)) } })} className="mt-1 w-full rounded-[14px] border border-slate-200 px-3 py-2" />
              </label>
            </div>
          </section>

          {/* SERVICEABILITY */}
          <section className="rounded-[14px] border border-[#f0dfe6] bg-white p-5">
            <h2 className="gift-heading text-xl font-bold text-[#3E155C]">
              Serviceability
            </h2>

            <label className="mt-4 flex items-center gap-2 rounded-[14px] bg-[#f5fbff] p-3 text-sm font-semibold">
              <input
                type="checkbox"
                checked={
                  product.serviceability.nationwide
                }
                onChange={(event) =>
                  updateNested("serviceability", {
                    ...product.serviceability,
                    nationwide:
                      event.target.checked,
                  })
                }
              />
              Nationwide serviceability
            </label>

            <div className="mt-4 flex gap-2">
              <input
                value={pincodeInput}
                onChange={(event) =>
                  setPincodeInput(event.target.value)
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addPincode();
                  }
                }}
                placeholder="Add pincode"
                className="min-w-0 flex-1 rounded-[14px] border border-slate-200 px-3 py-2"
              />

              <button
                type="button"
                onClick={addPincode}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold"
              >
                Add
              </button>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {product.serviceability.pincodes.map(
                (pincode) => (
                  <button
                    type="button"
                    key={pincode}
                    onClick={() =>
                      removePincode(pincode)
                    }
                    className="rounded-full bg-[#f5fbff] px-3 py-1 text-sm text-[#3E155C]"
                  >
                    {pincode} ×
                  </button>
                ),
              )}
            </div>
          </section>

          {/* PERSONALIZATION */}
          <section className="rounded-[14px] border border-[#f0dfe6] bg-white p-5">
            <h2 className="gift-heading text-xl font-bold text-[#3E155C]">
              Personalization
            </h2>

            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <label className="flex items-center gap-2 rounded-[14px] bg-[#f5fbff] p-3 text-sm font-semibold">
                <input
                  type="checkbox"
                  checked={
                    product.personalization.enabled
                  }
                  onChange={(event) =>
                    updateNested("personalization", {
                      ...product.personalization,
                      enabled:
                        event.target.checked,
                    })
                  }
                />
                Enable personalization
              </label>

              <label className="text-sm font-semibold">
                Maximum characters

                <input
                  type="number"
                  min="0"
                  value={
                    product.personalization
                      .maxCharacters
                  }
                  onChange={(event) =>
                    updateNested("personalization", {
                      ...product.personalization,
                      maxCharacters: Number(
                        event.target.value,
                      ),
                    })
                  }
                  className="mt-1 w-full rounded-[14px] border border-slate-200 px-3 py-2"
                />
              </label>

              <label className="flex items-center gap-2 rounded-[14px] bg-[#f5fbff] p-3 text-sm font-semibold">
                <input
                  type="checkbox"
                  checked={
                    product.personalization.imageUpload
                  }
                  onChange={(event) =>
                    updateNested("personalization", {
                      ...product.personalization,
                      imageUpload:
                        event.target.checked,
                    })
                  }
                />
                Allow image upload
              </label>
            </div>

            <div className="mt-4 flex gap-2">
              <input
                value={personalizationField}
                onChange={(event) =>
                  setPersonalizationField(
                    event.target.value,
                  )
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addPersonalizationField();
                  }
                }}
                placeholder="Personalization field"
                className="min-w-0 flex-1 rounded-[14px] border border-slate-200 px-3 py-2"
              />

              <button
                type="button"
                onClick={addPersonalizationField}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold"
              >
                Add
              </button>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {product.personalization.fields.map(
                (field) => (
                  <button
                    type="button"
                    key={field}
                    onClick={() =>
                      removePersonalizationField(field)
                    }
                    className="rounded-full bg-[#f5fbff] px-3 py-1 text-sm text-[#3E155C]"
                  >
                    {field} ×
                  </button>
                ),
              )}
            </div>
          </section>

          {/* STATUS / FLAGS */}
          <section className="rounded-[14px] border border-[#f0dfe6] bg-white p-5">
            <h2 className="gift-heading text-xl font-bold text-[#3E155C]">
              Publishing
            </h2>

            <div className="mt-4 grid gap-4 md:grid-cols-4">
              <label className="text-sm font-semibold">
                Status

                <select
                  value={product.status}
                  onChange={(event) =>
                    setField(
                      "status",
                      event.target.value as Product["status"],
                    )
                  }
                  className="mt-1 w-full rounded-[14px] border border-slate-200 px-3 py-2"
                >
                  <option value="draft">
                    Draft
                  </option>
                  <option value="live">
                    Live
                  </option>
                  <option value="archived">
                    Archived
                  </option>
                </select>
              </label>

              {(
                [
                  ["featured", "Featured"],
                  ["bestseller", "Bestseller"],
                  ["newArrival", "New arrival"],
                ] as const
              ).map(([key, label]) => (
                <label
                  key={key}
                  className="flex items-center gap-2 self-end rounded-[14px] bg-[#f5fbff] p-3 text-sm font-semibold"
                >
                  <input
                    type="checkbox"
                    checked={product[key]}
                    onChange={(event) =>
                      setField(
                        key,
                        event.target.checked,
                      )
                    }
                  />
                  {label}
                </label>
              ))}
            </div>
          </section>

          {/* SEO */}
          <section className="rounded-[14px] border border-[#f0dfe6] bg-white p-5">
            <h2 className="gift-heading text-xl font-bold text-[#3E155C]">
              SEO
            </h2>

            <div className="mt-4 space-y-4">
              <label className="block text-sm font-semibold">
                SEO title

                <input
                  value={product.seo.title}
                  onChange={(event) =>
                    updateNested("seo", {
                      ...product.seo,
                      title: event.target.value,
                    })
                  }
                  className="mt-1 w-full rounded-[14px] border border-slate-200 px-3 py-2"
                />
              </label>

              <label className="block text-sm font-semibold">
                SEO description

                <textarea
                  value={product.seo.description}
                  onChange={(event) =>
                    updateNested("seo", {
                      ...product.seo,
                      description:
                        event.target.value,
                    })
                  }
                  className="mt-1 min-h-24 w-full rounded-[14px] border border-slate-200 px-3 py-2"
                />
              </label>

              <div>
                <p className="text-sm font-semibold">
                  SEO keywords
                </p>

                <div className="mt-2 flex gap-2">
                  <input
                    value={keywordInput}
                    onChange={(event) =>
                      setKeywordInput(
                        event.target.value,
                      )
                    }
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        addKeyword();
                      }
                    }}
                    placeholder="Add keyword"
                    className="min-w-0 flex-1 rounded-[14px] border border-slate-200 px-3 py-2"
                  />

                  <button
                    type="button"
                    onClick={addKeyword}
                    className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold"
                  >
                    Add
                  </button>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {product.seo.keywords.map(
                    (keyword) => (
                      <button
                        type="button"
                        key={keyword}
                        onClick={() =>
                          removeKeyword(keyword)
                        }
                        className="rounded-full bg-[#f5fbff] px-3 py-1 text-sm text-[#3E155C]"
                      >
                        {keyword} ×
                      </button>
                    ),
                  )}
                </div>
              </div>
            </div>
          </section>

          {error && (
            <div className="rounded-[14px] border border-[#f0cbd8] bg-white px-4 py-3 text-sm text-[#bd1d52]">
              {error}
            </div>
          )}

          <div className="flex flex-wrap gap-3"><button type="button" disabled={busy||uploading} onClick={event=>{if(productId&&product.status==='live'&&!window.confirm('Save as draft and unpublish this demo product?'))return;void save(event,true);}} className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold">Save as draft</button><button type="button" onClick={()=>setPreviewOpen(true)} className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold">Preview product</button><span className="self-center text-xs text-slate-500">{dirty?'Unsaved changes':'No unsaved changes'}</span></div>
          <div className="sticky bottom-0 z-10 -mx-4 border-t border-[#f0dfe6] bg-[#fffafd]/95 px-4 py-4 backdrop-blur md:static md:mx-0 md:border-0 md:bg-transparent md:px-0 md:backdrop-blur-none">
            <button
              type="submit"
              disabled={busy || uploading}
              className="w-full rounded-full bg-[#62298E] px-7 py-3 font-semibold text-white transition hover:bg-[#3E155C] disabled:cursor-not-allowed disabled:opacity-60 md:w-auto"
            >
              {busy
                ? "Saving…"
                : productId
                  ? "Update Product"
                  : "Create Product"}
            </button>
          </div>
        </form>
        <ProductPreview open={previewOpen} product={product} onClose={()=>setPreviewOpen(false)}/>
      </div>
    </main>
  );
}
