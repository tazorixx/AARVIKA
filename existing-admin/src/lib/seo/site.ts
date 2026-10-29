export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
export const SITE_NAME = "Gift4U";
export const SITE_DESCRIPTION = "Thoughtful gifts, personalised hampers and celebration gifts delivered with Gift4U.";

export const COMPANY_NAME = process.env.NEXT_PUBLIC_COMPANY_NAME || "Gift4U";
export const COMPANY_CIN = process.env.NEXT_PUBLIC_COMPANY_CIN || "";
export const GRIEVANCE_OFFICER = process.env.NEXT_PUBLIC_GRIEVANCE_OFFICER || "";
export const REGISTERED_ADDRESS = process.env.NEXT_PUBLIC_REGISTERED_ADDRESS || "";

export function absoluteUrl(path = "") {
  if (!path) return SITE_URL;
  return `${SITE_URL}/${path.replace(/^\//, "")}`;
}

export function cleanMeta(value: string | undefined, fallback: string) {
  const text = (value || fallback).replace(/\s+/g, " ").trim();
  return text.length > 160 ? `${text.slice(0, 157).trimEnd()}...` : text;
}

export function taxonomyMetadata(args: { name: string; description?: string; slug: string; type: "category" | "occasion" | "recipient" | "collection"; image?: string }) {
  const title = args.name;
  const description = cleanMeta(args.description, `Shop ${args.name} gifts on ${SITE_NAME}. Discover thoughtful and personalised gifts for every celebration.`);
  const path = `/${args.type}/${args.slug}`;
  return {
    title,
    description,
    alternates: { canonical: absoluteUrl(path) },
    openGraph: { type: "website" as const, title, description, url: absoluteUrl(path), ...(args.image ? { images: [{ url: args.image, alt: args.name }] } : {}) },
    twitter: { card: "summary_large_image" as const, title, description, ...(args.image ? { images: [args.image] } : {}) },
  };
}
