import {validPageKey,parseVisualMedia,type IllustrationKind} from '@aarvika/catalogue/visual-commerce';
export type HomepageSectionType = "hero" | "banner" | "text" | "link" | "categories" | "products" | "collection";
export type HomepageSectionStatus = "draft" | "published" | "scheduled";

export type HomepageSection = {
  pageKey?:string;imageAlt?:string;imageFit?:'contain'|'cover';illustration?:IllustrationKind;
  id: string;
  type: HomepageSectionType;
  title: string;
  subtitle: string;
  imageUrl: string;
  linkUrl: string;
  buttonLabel: string;
  sortOrder: number;
  isActive: boolean;
  status: HomepageSectionStatus;
  scheduledAt: string | null;
  sourceId?: string;
  productIds?: string[];
  selection?: "manual" | "featured" | "new-arrivals" | "best-sellers";
  limit?: number;
};

export const HOMEPAGE_ADMIN_ROLES = ["SUPER_ADMIN", "ADMIN", "CATALOG_MANAGER"] as const;
const TYPES: HomepageSectionType[] = ["hero", "banner", "text", "link", "categories", "products", "collection"];

export function normalizeHomepageSection(id: string, data: Record<string, unknown>): HomepageSection {
  const type = TYPES.includes(data.type as HomepageSectionType) ? data.type as HomepageSectionType : "banner";
  const rawStatus = String(data.status || "published");
  const status: HomepageSectionStatus = rawStatus === "draft" || rawStatus === "scheduled" ? rawStatus : "published";
  let scheduledAt: string | null = null;
  const rawScheduled = data.scheduledAt;
  if (typeof rawScheduled === "string") scheduledAt = rawScheduled;
  else if (rawScheduled && typeof rawScheduled === "object" && "toDate" in rawScheduled && typeof (rawScheduled as { toDate?: unknown }).toDate === "function") {
    scheduledAt = (rawScheduled as { toDate: () => Date }).toDate().toISOString();
  }
  return {
    id,
    pageKey:String(data.pageKey||'home'),imageAlt:String(data.imageAlt||data.title||''),imageFit:data.imageFit==='cover'?'cover':'contain',...(data.illustration?{illustration:data.illustration as IllustrationKind}:{}),
    type,
    title: String(data.title || ""),
    subtitle: String(data.subtitle || ""),
    imageUrl: String(data.imageUrl || ""),
    linkUrl: String(data.linkUrl || ""),
    buttonLabel: String(data.buttonLabel || ""),
    sortOrder: Number.isFinite(Number(data.sortOrder)) ? Number(data.sortOrder) : 0,
    isActive: data.isActive !== false,
    status,
    scheduledAt,
    sourceId:String(data.sourceId||""),productIds:Array.isArray(data.productIds)?data.productIds.filter((id):id is string=>typeof id==="string"&&!!id):[],selection:["manual","featured","new-arrivals","best-sellers"].includes(String(data.selection))?data.selection as HomepageSection["selection"]:"manual",limit:Number(data.limit)||8,
  };
}

export function validateHomepageInput(body: Record<string, unknown>) {
  if(body.pageKey&&!validPageKey(String(body.pageKey)))return {valid:false as const,error:'Invalid mobile page key.'};
  try{parseVisualMedia({imagePath:body.imageUrl||'',imageAlt:body.imageAlt||body.title||'',...(body.imageFit?{imageFit:body.imageFit}:{}),...(body.illustration?{illustration:body.illustration}:{})});}catch(e){return {valid:false as const,error:(e as Error).message};}
  if(typeof body.sourceId==='string'&&body.sourceId.startsWith('@')&&!['@shortcuts','@families','@department','@collections','@functions','@regions','@recipients','@milestones','@interests','@budget','@fabrics','@sizes','@uses','@promo'].includes(body.sourceId))return {valid:false as const,error:'Unknown visual source.'};
  if (body.type !== undefined && !TYPES.includes(String(body.type) as HomepageSectionType)) return { valid: false as const, error: "Invalid homepage section type." };
  if(body.linkUrl && (!/^\/(?!\/)/.test(String(body.linkUrl)) || /[\\\u0000-\u001f]/.test(String(body.linkUrl))))return {valid:false as const,error:"Use a local application route."};
  if(body.productIds!==undefined && (!Array.isArray(body.productIds)||body.productIds.length>100||body.productIds.some(id=>typeof id!=="string")))return {valid:false as const,error:"Choose at most 100 product IDs."};
  if(body.limit!==undefined&&(!Number.isInteger(Number(body.limit))||Number(body.limit)<1||Number(body.limit)>24))return {valid:false as const,error:"Section limit must be 1–24."};
  if(body.selection!==undefined&&!["manual","featured","new-arrivals","best-sellers"].includes(String(body.selection)))return {valid:false as const,error:"Invalid product selection."};
  const title = String(body.title || "").trim();
  if (title.length > 120) return { valid: false as const, error: "Title is too long." };
  const subtitle = String(body.subtitle || "").trim();
  if (subtitle.length > 240) return { valid: false as const, error: "Subtitle is too long." };
  if (body.scheduledAt !== undefined && body.scheduledAt !== null && body.scheduledAt !== "") {
    const date = new Date(String(body.scheduledAt));
    if (Number.isNaN(date.getTime())) return { valid: false as const, error: "Invalid scheduled publish date." };
  }
  return { valid: true as const };
}

export function sectionPayload(data: HomepageSection | Record<string, unknown>) {
  return {
    pageKey:String(data.pageKey||'home').trim(),imageAlt:String(data.imageAlt||data.title||'').trim(),imageFit:data.imageFit==='cover'?'cover':'contain',...(data.illustration?{illustration:data.illustration}:{}),
    type: data.type || "banner",
    sourceId:String(data.sourceId||"").trim(),productIds:Array.isArray(data.productIds)?[...new Set(data.productIds.filter((id):id is string=>typeof id==="string"&&!!id.trim()).map(id=>id.trim()))]:[],selection:data.selection||"manual",limit:Number(data.limit)||8,
    title: String(data.title || "").trim(),
    subtitle: String(data.subtitle || "").trim(),
    imageUrl: String(data.imageUrl || "").trim(),
    linkUrl: String(data.linkUrl || "").trim(),
    buttonLabel: String(data.buttonLabel || "").trim(),
    sortOrder: Number.isFinite(Number(data.sortOrder)) ? Number(data.sortOrder) : 0,
    isActive: data.isActive !== false,
  };
}
