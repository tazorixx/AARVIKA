import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import type { Product } from "@/lib/catalog/types";

export const runtime = "nodejs";

function matchesQuery(product: Product, query: string) {
  if (!query) return true;
  const needle = query.trim().toLowerCase();
  return [product.title, product.slug, product.shortDescription, product.description].some((value) => value?.toLowerCase().includes(needle));
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug")?.trim() || "";
  const query = searchParams.get("q")?.trim() || "";
  const categoryId = searchParams.get("categoryId")?.trim() || "";
  const occasionId = searchParams.get("occasionId")?.trim() || "";
  const recipientId = searchParams.get("recipientId")?.trim() || "";
  const collectionId = searchParams.get("collectionId")?.trim() || "";
  const featured = searchParams.get("featured") === "true";
  const bestseller = searchParams.get("bestseller") === "true";
  const newArrival = searchParams.get("newArrival") === "true";
  const limitValue = Number(searchParams.get("limit") || 200);
  const limit = Number.isFinite(limitValue) ? Math.min(Math.max(Math.floor(limitValue), 1), 200) : 200;

  const db = getAdminDb();
  const [products, categories, occasions, recipients, collections] = await Promise.all([
    db.collection("products").where("status", "==", "live").limit(200).get(),
    db.collection("categories").where("active", "==", true).orderBy("sortOrder").limit(100).get(),
    db.collection("occasions").where("active", "==", true).orderBy("sortOrder").limit(100).get(),
    db.collection("recipients").where("active", "==", true).orderBy("sortOrder").limit(100).get(),
    db.collection("collections").where("active", "==", true).orderBy("sortOrder").limit(100).get(),
  ]);

  let productData = products.docs.map((d) => ({ id: d.id, ...d.data() }) as Product);
  if (slug) productData = productData.filter((product) => product.slug === slug);
  if (query) productData = productData.filter((product) => matchesQuery(product, query));
  if (categoryId) productData = productData.filter((product) => product.categoryIds?.includes(categoryId));
  if (occasionId) productData = productData.filter((product) => product.occasionIds?.includes(occasionId));
  if (recipientId) productData = productData.filter((product) => product.recipientIds?.includes(recipientId));
  if (collectionId) productData = productData.filter((product) => product.collectionIds?.includes(collectionId));
  if (featured) productData = productData.filter((product) => product.featured);
  if (bestseller) productData = productData.filter((product) => product.bestseller);
  if (newArrival) productData = productData.filter((product) => product.newArrival);
  productData = productData.slice(0, limit);

  return NextResponse.json({
    products: productData,
    categories: categories.docs.map((d) => ({ id: d.id, ...d.data() })),
    occasions: occasions.docs.map((d) => ({ id: d.id, ...d.data() })),
    recipients: recipients.docs.map((d) => ({ id: d.id, ...d.data() })),
    collections: collections.docs.map((d) => ({ id: d.id, ...d.data() })),
  }, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } });
}
