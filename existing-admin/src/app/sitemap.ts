import type { MetadataRoute } from "next";
import { getAdminDb } from "@/lib/firebase-admin";
import { absoluteUrl } from "@/lib/seo/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const db = getAdminDb();
  const entries: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), changeFrequency: "daily", priority: 1 },
    { url: absoluteUrl("/products"), changeFrequency: "daily", priority: 0.9 },
    { url: absoluteUrl("/occasions"), changeFrequency: "weekly", priority: 0.7 },
    { url: absoluteUrl("/wedding"), changeFrequency: "weekly", priority: 0.7 },
    { url: absoluteUrl("/birthday"), changeFrequency: "weekly", priority: 0.7 },
    { url: absoluteUrl("/anniversary"), changeFrequency: "weekly", priority: 0.7 },
    { url: absoluteUrl("/hampers"), changeFrequency: "weekly", priority: 0.7 },
    { url: absoluteUrl("/personalised"), changeFrequency: "weekly", priority: 0.7 },
  ];

  const [products, categories, occasions, recipients, collections] = await Promise.all([
    db.collection("products").where("status", "==", "live").limit(5000).get(),
    db.collection("categories").where("active", "==", true).limit(1000).get(),
    db.collection("occasions").where("active", "==", true).limit(1000).get(),
    db.collection("recipients").where("active", "==", true).limit(1000).get(),
    db.collection("collections").where("active", "==", true).limit(1000).get(),
  ]);

  entries.push(
    ...products.docs.map((doc) => ({ url: absoluteUrl(`/product/${String(doc.data().slug || doc.id)}`), changeFrequency: "daily" as const, priority: 0.8 })),
    ...categories.docs.filter((doc) => doc.data().slug).map((doc) => ({ url: absoluteUrl(`/category/${doc.data().slug}`), changeFrequency: "weekly" as const, priority: 0.7 })),
    ...occasions.docs.filter((doc) => doc.data().slug).map((doc) => ({ url: absoluteUrl(`/occasion/${doc.data().slug}`), changeFrequency: "weekly" as const, priority: 0.7 })),
    ...recipients.docs.filter((doc) => doc.data().slug).map((doc) => ({ url: absoluteUrl(`/recipient/${doc.data().slug}`), changeFrequency: "weekly" as const, priority: 0.6 })),
    ...collections.docs.filter((doc) => doc.data().slug).map((doc) => ({ url: absoluteUrl(`/collection/${doc.data().slug}`), changeFrequency: "weekly" as const, priority: 0.6 })),
  );

  return entries;
}
