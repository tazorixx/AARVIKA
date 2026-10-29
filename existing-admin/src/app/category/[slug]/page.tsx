import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CatalogListing from "@/components/catalog/CatalogListing";
import TaxonomyCms from "@/components/catalog/TaxonomyCms";
import { getLiveProductsForTaxonomy, getTaxonomyBySlug } from "@/lib/catalog/public";
import { getAdminDb } from "@/lib/firebase-admin";
import { getTaxonomyPageCmsBySlug } from "@/lib/merchandising/cms";
import type { Product } from "@/lib/catalog/types";
import { absoluteUrl, taxonomyMetadata } from "@/lib/seo/site";
import { JsonLd, breadcrumbSchema } from "@/lib/seo/schema";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const taxonomy = await getTaxonomyBySlug("categories", slug);
  if (!taxonomy) return { title: "Page not found" };
  return taxonomyMetadata({ name: taxonomy.name, description: taxonomy.description, slug, type: "category", image: taxonomy.image });
}

export default async function CategoryListingPage({ params }: PageProps) { const { slug } = await params; const taxonomy = await getTaxonomyBySlug("categories", slug); if (!taxonomy) notFound(); const products = await getLiveProductsForTaxonomy("categories", taxonomy.id); const result = await getTaxonomyPageCmsBySlug("category", slug); const cms = result?.cms; const featuredProducts = cms?.featuredProductIds?.length ? (await Promise.all(cms.featuredProductIds.map((id) => getAdminDb().collection("products").doc(id).get()))).filter((s) => s.exists).map((s) => ({ id: s.id, ...s.data() }) as Product).filter((p) => p.status === "live") : []; const featuredCategories = cms?.featuredCategoryIds?.length ? (await Promise.all(cms.featuredCategoryIds.map((id) => getAdminDb().collection("categories").doc(id).get()))).filter((s) => s.exists).map((s) => ({ id: s.id, ...s.data() }) as { id: string; name: string; slug: string; image?: string }) : []; return <><JsonLd data={breadcrumbSchema([{ name: "Home", url: "/" }, { name: taxonomy.name, url: `/{kind}/${taxonomy.slug}` }])} /><Header />{cms && <TaxonomyCms taxonomy={taxonomy} cms={cms} featuredProducts={featuredProducts} featuredCategories={featuredCategories} />}<CatalogListing title={cms?.heroTitle || taxonomy.name} description={cms?.heroDescription || taxonomy.description} products={products} hideHero={Boolean(cms)} />{cms?.bannerTitle && !cms ? null : null}<Footer /></>; }
