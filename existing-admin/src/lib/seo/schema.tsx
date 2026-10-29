import type { Product } from "@/lib/catalog/types";
import { absoluteUrl, COMPANY_NAME, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "./site";

export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: COMPANY_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
  };
}

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function productSchema(product: Product) {
  const image = product.images?.map((item) => item.url).filter(Boolean);
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.shortDescription || product.description,
    sku: product.sku,
    url: absoluteUrl(`/product/${product.slug}`),
    ...(image?.length ? { image } : product.thumbnail ? { image: [product.thumbnail] } : {}),
    brand: { "@type": "Brand", name: SITE_NAME },
    offers: {
      "@type": "Offer",
      url: absoluteUrl(`/product/${product.slug}`),
      priceCurrency: "INR",
      price: Number(product.price || 0).toFixed(2),
      availability: product.status === "live" && Number(product.inventory?.quantity || 0) > 0
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    },
    ...(Number(product.reviewCount || 0) > 0 && Number(product.rating || 0) > 0
      ? { aggregateRating: { "@type": "AggregateRating", ratingValue: Number(product.rating), reviewCount: Number(product.reviewCount) } }
      : {}),
  };
}

export function breadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.url),
    })),
  };
}
