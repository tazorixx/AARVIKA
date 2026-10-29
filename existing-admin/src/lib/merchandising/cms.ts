import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase-admin";
import { removeUndefinedDeep } from "@/lib/firestore-sanitize";

export type MerchandisingCmsType = "category" | "occasion";

export interface TaxonomyPageCms {
  id: string;
  type: MerchandisingCmsType;
  taxonomyId: string;
  taxonomySlug: string;
  heroTitle?: string;
  heroDescription?: string;
  heroImage?: string;
  bannerTitle?: string;
  bannerDescription?: string;
  bannerImage?: string;
  featuredProductIds: string[];
  featuredCategoryIds: string[];
  sortOrder: number;
  active: boolean;
  seoTitle?: string;
  seoDescription?: string;
  updatedAt?: unknown;
}

const COLLECTION = "taxonomy_page_merchandising";

function docId(type: MerchandisingCmsType, taxonomyId: string) {
  return `${type}_${taxonomyId}`;
}

function ref(type: MerchandisingCmsType, taxonomyId: string) {
  return getAdminDb().collection(COLLECTION).doc(docId(type, taxonomyId));
}

function clean(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function cleanIds(value: unknown) {
  return Array.isArray(value) ? [...new Set(value.filter((item): item is string => typeof item === "string" && !!item.trim()).map((item) => item.trim()))].slice(0, 20) : [];
}

export function normalizeTaxonomyPageCmsInput(type: MerchandisingCmsType, body: Record<string, unknown>) {
  const taxonomyId = clean(body.taxonomyId);
  const taxonomySlug = clean(body.taxonomySlug);
  if (!taxonomyId || !taxonomySlug) throw new Error("Taxonomy selection is required.");

  return {
    type,
    taxonomyId,
    taxonomySlug,
    heroTitle: clean(body.heroTitle),
    heroDescription: clean(body.heroDescription),
    heroImage: clean(body.heroImage),
    bannerTitle: clean(body.bannerTitle),
    bannerDescription: clean(body.bannerDescription),
    bannerImage: clean(body.bannerImage),
    featuredProductIds: cleanIds(body.featuredProductIds),
    featuredCategoryIds: cleanIds(body.featuredCategoryIds),
    sortOrder: Number.isFinite(Number(body.sortOrder)) ? Number(body.sortOrder) : 0,
    active: body.active !== false,
    seoTitle: clean(body.seoTitle),
    seoDescription: clean(body.seoDescription),
  };
}

export async function getTaxonomyPageCms(type: MerchandisingCmsType, taxonomyId: string) {
  const snap = await ref(type, taxonomyId).get();
  if (!snap.exists) return null;
  return { id: snap.id, ...snap.data() } as TaxonomyPageCms;
}

export async function listTaxonomyPageCms(type: MerchandisingCmsType) {
  const snap = await getAdminDb().collection(COLLECTION).where("type", "==", type).get();
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as TaxonomyPageCms).sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function saveTaxonomyPageCms(type: MerchandisingCmsType, data: ReturnType<typeof normalizeTaxonomyPageCmsInput>) {
  const document = ref(type, data.taxonomyId);
  await document.set({ ...removeUndefinedDeep(data), updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  return document.id;
}

export async function getTaxonomyPageCmsBySlug(type: MerchandisingCmsType, slug: string) {
  const collection = type === "category" ? "categories" : "occasions";
  const taxonomySnap = await getAdminDb().collection(collection).where("slug", "==", slug).limit(1).get();
  if (taxonomySnap.empty) return null;
  const taxonomy = { id: taxonomySnap.docs[0].id, ...taxonomySnap.docs[0].data() } as { id: string; name: string; slug: string; image?: string; description?: string; active: boolean };
  const cms = await getTaxonomyPageCms(type, taxonomy.id);
  return { taxonomy, cms: cms?.active ? cms : null };
}

export async function getLiveProductsByIds(ids: string[]) {
  if (!ids.length) return [];
  const unique = [...new Set(ids)].slice(0, 20);
  const snapshots = await Promise.all(unique.map((id) => getAdminDb().collection("products").doc(id).get()));
  return snapshots.filter((snap) => snap.exists).map((snap) => ({ id: snap.id, ...snap.data() })) as Array<Record<string, unknown> & { id: string }>;
}
