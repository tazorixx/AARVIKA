import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CatalogListing from "@/components/catalog/CatalogListing";
import { getLiveProductsForTaxonomy, getTaxonomyBySlug } from "@/lib/catalog/public";
import { taxonomyMetadata } from "@/lib/seo/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const taxonomy = await getTaxonomyBySlug("recipients", slug);
  if (!taxonomy) return { title: "Page not found" };
  return taxonomyMetadata({ name: taxonomy.name, description: taxonomy.description, slug, type: "recipient", image: taxonomy.image });
}


export default async function RecipientListingPage({ params }: PageProps) {
  const { slug } = await params;
  const taxonomy = await getTaxonomyBySlug("recipients", slug);
  if (!taxonomy) notFound();
  const products = await getLiveProductsForTaxonomy("recipients", taxonomy.id);
  return <><Header /><CatalogListing title={taxonomy.name} description={taxonomy.description} products={products} /><Footer /></>;
}
