import { getAdminDb } from "@/lib/firebase-admin";
import type { Product, TaxonomyType } from "@/lib/catalog/types";

const TAXONOMY_TYPES: TaxonomyType[] = [
  "categories",
  "occasions",
  "recipients",
  "collections",
];

export async function getLiveProducts(limit = 200): Promise<Product[]> {
  const snapshot = await getAdminDb()
    .collection("products")
    .where("status", "==", "live")
    .limit(limit)
    .get();

  return snapshot.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }) as Product)
    .filter((product) => !product.personalization?.imageUpload);
}

export async function getTaxonomyBySlug(type: TaxonomyType, slug: string) {
  if (!TAXONOMY_TYPES.includes(type)) {
    throw new Error("Unsupported taxonomy type.");
  }

  const snapshot = await getAdminDb()
    .collection(type)
    .where("slug", "==", slug)
    .limit(1)
    .get();

  if (snapshot.empty) return null;

  const doc = snapshot.docs[0];
  const data = doc.data();
  if (data.active !== true) return null;

  return { id: doc.id, ...data } as {
    id: string;
    name: string;
    slug: string;
    image?: string;
    description?: string;
    sortOrder: number;
    active: boolean;
  };
}

export async function getLiveProductsForTaxonomy(
  type: TaxonomyType,
  taxonomyId: string,
  limit = 200,
): Promise<Product[]> {
  const field = {
    categories: "categoryIds",
    occasions: "occasionIds",
    recipients: "recipientIds",
    collections: "collectionIds",
  }[type];

  const snapshot = await getAdminDb()
    .collection("products")
    .where(field, "array-contains", taxonomyId)
    .limit(limit)
    .get();

  return snapshot.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }) as Product)
    .filter((product) => product.status === "live" && !product.personalization?.imageUpload);
}
