import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import type { Product, TaxonomyBase } from "@/lib/catalog/types";
import { checkRateLimit, getClientKey, rateLimitResponse } from "@/lib/rate-limit";
import {
  buildSearchTaxonomyMatches,
  expandSearchTerms,
  normalizeSearchKey,
  scoreSearchProduct,
} from "@/lib/search/catalog-search";

export const runtime = "nodejs";

function taxonomyFromSnapshot(docs: { id: string; data(): FirebaseFirestore.DocumentData }[]) {
  return docs.map((doc) => ({ id: doc.id, ...doc.data() }) as TaxonomyBase);
}

export async function GET(request: Request) {
  const rate = checkRateLimit(`search:${getClientKey(request)}`, 60, 60_000);
  if (!rate.allowed) return rateLimitResponse(rate.resetAt);
  const { searchParams } = new URL(request.url);
  const query = normalizeSearchKey(searchParams.get("q") || "");
  if (!query) return NextResponse.json({ products: [], redirected: null });

  const db = getAdminDb();
  const configSnap = await db.collection("search_synonyms").get();
  const synonyms: Record<string, string[]> = {};
  configSnap.docs.forEach((doc) => {
    const data = doc.data();
    const key = normalizeSearchKey(String(data.term || ""));
    const values = Array.isArray(data.synonyms)
      ? data.synonyms.map((value) => normalizeSearchKey(String(value))).filter(Boolean)
      : [];
    if (key) synonyms[key] = values;
  });

  const redirect = await db.collection("search_redirects").doc(query.replace(/[^a-z0-9_-]+/g, "-")).get();
  if (redirect.exists) {
    const target = String(redirect.data()?.target || "");
    if (target) {
      await db.collection("search_queries").add({ query, resultCount: 0, redirected: true, target, createdAt: new Date() });
      return NextResponse.json({ products: [], redirected: target });
    }
  }

  const [productSnap, pinnedSnap, categorySnap, occasionSnap, recipientSnap, collectionSnap] = await Promise.all([
    db.collection("products").where("status", "==", "live").limit(500).get(),
    db.collection("search_pins").where("active", "==", true).get(),
    db.collection("categories").where("active", "==", true).limit(100).get(),
    db.collection("occasions").where("active", "==", true).limit(100).get(),
    db.collection("recipients").where("active", "==", true).limit(100).get(),
    db.collection("collections").where("active", "==", true).limit(100).get(),
  ]);

  const terms = expandSearchTerms(query, synonyms);
  const taxonomyMatches = buildSearchTaxonomyMatches({
    categories: taxonomyFromSnapshot(categorySnap.docs),
    occasions: taxonomyFromSnapshot(occasionSnap.docs),
    recipients: taxonomyFromSnapshot(recipientSnap.docs),
    collections: taxonomyFromSnapshot(collectionSnap.docs),
  }, terms);

  const pinned = new Map<string, number>();
  pinnedSnap.docs.forEach((doc) => {
    const data = doc.data();
    const term = normalizeSearchKey(String(data.query || ""));
    if (term === query) pinned.set(String(data.productId || ""), Number(data.position || 0));
  });

  const products = productSnap.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }) as Product)
    .map((product) => ({ product, score: scoreSearchProduct(product, terms, taxonomyMatches), pin: pinned.get(product.id) }))
    .filter(({ score, pin }) => score > 0 || pin !== undefined)
    .sort((a, b) => (a.pin !== undefined ? 0 : 1) - (b.pin !== undefined ? 0 : 1)
      || (a.pin ?? 9999) - (b.pin ?? 9999)
      || b.score - a.score)
    .slice(0, 48)
    .map(({ product }) => product);

  await db.collection("search_queries").add({
    query,
    resultCount: products.length,
    redirected: false,
    createdAt: new Date(),
  });

  return NextResponse.json({ products, redirected: null }, { headers: { "Cache-Control": "private, max-age=15" } });
}
