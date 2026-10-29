import { notFound } from "next/navigation";
import { getAdminDb } from "@/lib/firebase-admin";
import { getRelatedProducts } from "@/lib/catalog/related";
import type { Metadata } from "next";
import type { Product } from "@/lib/catalog/types";
import { absoluteUrl, cleanMeta, SITE_NAME } from "@/lib/seo/site";
import { JsonLd, breadcrumbSchema, productSchema } from "@/lib/seo/schema";
import ProductExperience from "@/components/product/ProductExperience";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ slug: string }> };

async function getProductBySlug(slug: string) {
  const snapshot = await getAdminDb().collection("products").where("slug", "==", slug).limit(1).get();
  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() } as Product;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product || product.status !== "live") return { title: "Gift not found" };
  const title = product.seo?.title || product.title;
  const description = cleanMeta(product.seo?.description, product.shortDescription || product.description || `Shop ${product.title} on ${SITE_NAME}.`);
  const image = product.thumbnail || product.images?.[0]?.url;
  return {
    title,
    description,
    alternates: { canonical: absoluteUrl(`/product/${product.slug}`) },
    openGraph: { type: "website", title, description, url: absoluteUrl(`/product/${product.slug}`), ...(image ? { images: [{ url: image, alt: product.title }] } : {}) },
    twitter: { card: "summary_large_image", title, description, ...(image ? { images: [image] } : {}) },
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const db = getAdminDb();

  const product = await getProductBySlug(slug);
  if (!product) notFound();

  if (product.status !== "live") notFound();

  const related = await getRelatedProducts(product, 4);

  return (
    <>
      <JsonLd data={productSchema(product)} />
      <JsonLd data={breadcrumbSchema([
        { name: "Home", url: "/" },
        { name: "Products", url: "/products" },
        { name: product.title, url: `/product/${product.slug}` },
      ])} />
      <ProductExperience product={product} related={related} />
    </>
  );
}
