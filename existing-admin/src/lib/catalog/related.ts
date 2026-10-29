import { getAdminDb } from "@/lib/firebase-admin";
import type { Product } from "@/lib/catalog/types";

export type RelatedMode = "auto" | "manual";

export type RelatedConfig = {
  mode: RelatedMode;
  productIds: string[];
};

function overlap(a: string[] = [], b: string[] = []) {
  if (!a.length || !b.length) return 0;
  const set = new Set(a);
  return b.reduce((count, value) => count + (set.has(value) ? 1 : 0), 0);
}

function scoreProduct(source: Product, candidate: Product) {
  let score = 0;

  const categoryOverlap = overlap(source.categoryIds, candidate.categoryIds);
  const occasionOverlap = overlap(source.occasionIds, candidate.occasionIds);
  const recipientOverlap = overlap(source.recipientIds, candidate.recipientIds);
  const collectionOverlap = overlap(source.collectionIds, candidate.collectionIds);
  const tagOverlap = overlap(source.tagIds, candidate.tagIds);
  const cultureOverlap = overlap(source.cultureTagIds, candidate.cultureTagIds);
  const stateOverlap = overlap(source.stateTagIds, candidate.stateTagIds);

  score += categoryOverlap * 42;
  score += occasionOverlap * 24;
  score += recipientOverlap * 18;
  score += collectionOverlap * 16;
  score += tagOverlap * 8;
  score += cultureOverlap * 6;
  score += stateOverlap * 6;

  const sourcePrice = Number(source.price || 0);
  const candidatePrice = Number(candidate.price || 0);
  if (sourcePrice > 0 && candidatePrice > 0) {
    const ratio = Math.abs(candidatePrice - sourcePrice) / sourcePrice;
    if (ratio <= 0.1) score += 12;
    else if (ratio <= 0.25) score += 8;
    else if (ratio <= 0.5) score += 3;
  }

  if (candidate.bestseller) score += 5;
  if (candidate.featured) score += 3;
  if (candidate.newArrival) score += 2;
  score += Math.min(Number(candidate.rating || 0), 5) * 1.5;

  return score;
}

function cleanProduct(product: Product) {
  return product;
}

export async function getRelatedProductConfig(productId: string): Promise<RelatedConfig> {
  const snap = await getAdminDb().collection("products").doc(productId).get();
  if (!snap.exists) return { mode: "auto", productIds: [] };
  const data = snap.data() as Partial<Product> & { relatedProductsMode?: RelatedMode };
  return {
    mode: data.relatedProductsMode === "manual" ? "manual" : "auto",
    productIds: Array.isArray(data.relatedProductIds)
      ? data.relatedProductIds.filter((id): id is string => typeof id === "string").slice(0, 12)
      : [],
  };
}

export async function getRelatedProducts(source: Product, limit = 4): Promise<Product[]> {
  const db = getAdminDb();
  const config = await getRelatedProductConfig(source.id);

  if (config.mode === "manual" && config.productIds.length) {
    const snapshots = await Promise.all(
      config.productIds.slice(0, 12).map((id) => db.collection("products").doc(id).get()),
    );

    const byId = new Map(
      snapshots
        .filter((snap) => snap.exists)
        .map((snap) => [snap.id, { id: snap.id, ...snap.data() } as Product]),
    );

    return config.productIds
      .map((id) => byId.get(id))
      .filter((product): product is Product => Boolean(product && product.status === "live" && product.id !== source.id))
      .slice(0, limit);
  }

  const snapshot = await db
    .collection("products")
    .where("status", "==", "live")
    .limit(250)
    .get();

  return snapshot.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }) as Product)
    .filter((candidate) => candidate.id !== source.id && !candidate.personalization?.imageUpload)
    .map((candidate) => ({ candidate, score: scoreProduct(source, candidate) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || Number(b.candidate.rating || 0) - Number(a.candidate.rating || 0))
    .slice(0, limit)
    .map(({ candidate }) => cleanProduct(candidate));
}
