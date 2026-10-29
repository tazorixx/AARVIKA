/** Additive v2 authoring contract. Existing fixture/local-api v1 stays unchanged. */
import { departments, type DepartmentId } from './departments.ts';
export const AUTHORING_VERSION = 2 as const;
export const departmentIds = departments.map(d => d.id);
export interface AuthoringFields {
  version: 2;
  departmentIds: DepartmentId[];
  canonicalCategoryId: string;
  productType: string;
  purchaseMode: 'buy' | 'inquiry';
  bundleEligible?: boolean; bundleUnits?: number;
  material: string; color: string; style: string;
  specs: Record<string, string>;
  discovery: { ageMin?: number; ageMax?: number; yearMin?: number; yearMax?: number; interests?: string[] };
  personalization?: { fields: { key: string; label: string; kind: 'text' | 'photo' | 'choice'; required: boolean; maxLength?: number; choices?: string[] }[]; photoMaxBytes: number; photoMimeTypes: string[] };
  bundle?: { components: { skuId: string; quantity: number }[]; packagingFeePaise: number; minItems: number; maxItems: number; capacity: number; allowedProductTypes: string[] };
  sizeGuide?: { unit: 'cm'; rows: { size: string; chest: number; length: number }[]; instructions: string };
  cultureIds: string[]; regionIds: string[]; ceremonyIds: string[];
  revision: number;
}
export interface AuthoringVariant { id?: string; name: string; value?: string; price?: number; priceDelta?: number; sku?: string; attributes?: Record<string, string>; quantity?: number }
export interface CanonicalSkuRecord {
  version: 2; id: string; productId: string; code: string; label: string;
  attributes: Record<string, string>; pricePaise: number; currency: 'INR';
  quantity: number; reserved: number; sold: number; revision: number;
}
export interface AuthoringCategory { furnitureSector?:'Home'|'Commercial'|''; id: string; name: string; parentId?: string | null; active: boolean; departmentId?: DepartmentId; level?: 1 | 2 | 3 }
export const inquiryStatuses=['new','reviewing','demo-quote','closed'] as const;
export interface AdminFurnitureInquiry {
  version:2;demo:true;id:string;customerLabel:string;kind:string;familyId:string;productId?:string;
  dimensions:{width:number;depth:number;height:number;unit:'cm'};material:string;finish:string;notes:string;
  budgetPaise:number;pincode:string;assemblyRequested:boolean;status:typeof inquiryStatuses[number];
  internalNote:string;quotePaise?:number;revision:number;
}
export function parseInquiryUpdate(input:Record<string,unknown>){
  if(Object.keys(input).some(k=>!['status','internalNote','quotePaise','revision'].includes(k)))throw new Error('Inquiry updates may change review fields only.');
  const revision=stockInteger(input.revision,'Revision');if(!revision)throw new Error('Reload the inquiry revision.');
  if(!inquiryStatuses.includes(input.status as typeof inquiryStatuses[number]))throw new Error('Choose a supported inquiry review state.');
  if(typeof input.internalNote!=='string'||input.internalNote.length>2000)throw new Error('Internal notes must be at most 2000 characters.');
  const quotePaise=input.quotePaise===undefined?undefined:stockInteger(input.quotePaise,'Demo quote paise');
  if(input.status==='demo-quote'&&!quotePaise)throw new Error('An internal demo quote needs a positive amount. Nothing is sent to the customer.');
  return {revision,status:input.status as typeof inquiryStatuses[number],internalNote:input.internalNote.trim(),...(quotePaise===undefined?{}:{quotePaise})};
}

export function rupeesToPaise(value: number) {
  if (!Number.isFinite(value) || value < 0 || !Number.isSafeInteger(Math.round(value * 100))) throw new Error('Price must be a valid non-negative rupee amount.');
  if (Math.abs(value * 100 - Math.round(value * 100)) > 0.000001) throw new Error('Use at most two decimal places for rupee prices.');
  return Math.round(value * 100);
}
export function stockInteger(value: unknown, label = 'Stock') {
  const n = Number(value);
  if (!Number.isSafeInteger(n) || n < 0) throw new Error(`${label} must be a non-negative whole number.`);
  return n;
}
export function variantCombination(attributes: Record<string, string>) {
  return JSON.stringify(Object.entries(attributes).map(([k,v]) => [k.trim().toLowerCase(),v.trim().toLowerCase()]).sort(([a],[b]) => a.localeCompare(b)));
}
export function validateVariants(variants: AuthoringVariant[], requireCodes = true) {
  const combinations = new Set<string>(), codes = new Set<string>(), ids = new Set<string>();
  for (const variant of variants) {
    const attributes = variant.attributes && Object.keys(variant.attributes).length ? variant.attributes : { [variant.name]: variant.value ?? variant.name };
    if (Object.entries(attributes).some(([k,v]) => !k.trim() || typeof v !== 'string' || !v.trim() || ['__proto__','constructor','prototype'].includes(k))) throw new Error('Variant attributes must have valid names and values.');
    if(new Set(Object.keys(attributes).map(k=>k.trim().toLowerCase())).size!==Object.keys(attributes).length)throw new Error('Variant attribute names must be unique.');
    const combination = variantCombination(attributes);
    if (combinations.has(combination)) throw new Error('Each variant combination must be unique.');
    combinations.add(combination);
    const code = variant.sku?.trim().toLowerCase();
    if ((!code && requireCodes) || (code && codes.has(code))) throw new Error('Every variant needs a unique SKU code.');
    if (code) codes.add(code);
    if (variant.id) { if (ids.has(variant.id)) throw new Error('Duplicate SKU identity.'); ids.add(variant.id); }
    if (variant.price !== undefined) rupeesToPaise(variant.price);
    stockInteger(variant.quantity ?? 0);
  }
}
export function blankAuthoring(): AuthoringFields {
  return { version: 2, departmentIds: [], canonicalCategoryId: '', productType: '', purchaseMode: 'buy', material: '', color: '', style: '', specs: {}, discovery: {}, cultureIds: [], regionIds: [], ceremonyIds: [], revision: 0 };
}
export function validateAuthoring(value: AuthoringFields, publish = false) {
  if (value.version !== 2 || !Array.isArray(value.departmentIds) || value.departmentIds.some(id => !departmentIds.includes(id))) throw new Error('Select only the eight confirmed departments.');
  if (new Set(value.departmentIds).size !== value.departmentIds.length) throw new Error('Duplicate department placement.');
  if (!['buy','inquiry'].includes(value.purchaseMode)) throw new Error('Choose buy or inquiry mode.');
  stockInteger(value.revision, 'Revision');
  if(value.bundleUnits!==undefined&&!stockInteger(value.bundleUnits,'Bundle units'))throw new Error('Bundle units must be positive.');
  for (const [k,v] of Object.entries(value.specs)) if (!k.trim() || typeof v !== 'string' || v.length > 2000 || ['__proto__','constructor','prototype'].includes(k)) throw new Error('Invalid product specification.');
  for (const [min,max] of [[value.discovery.ageMin,value.discovery.ageMax],[value.discovery.yearMin,value.discovery.yearMax]]) {
    if (min !== undefined) stockInteger(min, 'Minimum'); if (max !== undefined) stockInteger(max, 'Maximum');
    if (min !== undefined && max !== undefined && min > max) throw new Error('Minimum cannot exceed maximum.');
  }
  if (publish && (!value.departmentIds.length || !value.canonicalCategoryId || !value.productType.trim())) throw new Error('Publishing to AARVIKA requires department, canonical category and product type.');
  if(value.departmentIds.includes('furniture')) {
    for(const key of ['Width','Depth','Height']) if(value.specs[key]!==undefined && (!Number.isFinite(Number(value.specs[key])) || Number(value.specs[key])<=0)) throw new Error('Furniture dimensions must be positive centimetres.');
    if(value.specs.Unit && value.specs.Unit!=='cm') throw new Error('Furniture dimensions use cm.');
  }
  if(value.bundle){
    if(!value.departmentIds.some(id=>id==='wedding'||id==='hampers'))throw new Error('Component bundles require Wedding or Hampers placement.');
    const count=value.bundle.components.reduce((n,c)=>n+c.quantity,0);
    if(value.bundle.maxItems>value.bundle.capacity || (publish && (count<value.bundle.minItems || count>value.bundle.maxItems || count>value.bundle.capacity)))throw new Error('Bundle component count must fit item limits and capacity.');
  }
  if(publish&&value.personalization&&!value.personalization.fields.length)throw new Error('Add personalization fields or disable typed personalization.');
  if(publish&&value.sizeGuide&&!value.sizeGuide.rows.length)throw new Error('Add size guide measurements or disable the guide.');
  if (value.purchaseMode === 'inquiry' && !value.departmentIds.includes('furniture')) throw new Error('Inquiry-only configuration requires Furniture placement.');
}
export function parseAuthoring(input: unknown): AuthoringFields {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Invalid AARVIKA authoring configuration.');
  const row = input as Record<string, unknown>;
  if (row.version !== 2) throw new Error('Unsupported authoring contract version.');
  const base = blankAuthoring();
  const strings = (v: unknown): string[] => { if (v === undefined) return []; if (!Array.isArray(v) || v.some(s => typeof s !== 'string' || s.length > 200)) throw new Error('Invalid configuration choices.'); return [...new Set(v.map(s => s.trim()).filter(Boolean))]; };
  const text = (v: unknown) => typeof v === 'string' ? v.trim().slice(0,2000) : '';
  const stringRecord = (v: unknown): Record<string,string> => {
    if (v === undefined) return {};
    if (!v || typeof v !== 'object' || Array.isArray(v) || Object.entries(v).some(([k,s]) => typeof s !== 'string' || ['__proto__','constructor','prototype'].includes(k))) throw new Error('Invalid specification values.');
    return Object.fromEntries(Object.entries(v).map(([k,s]) => [k,text(s)]));
  };
  const discovery = row.discovery && typeof row.discovery === 'object' ? row.discovery as Record<string,unknown> : {};
  const result: AuthoringFields = { ...base, departmentIds: strings(row.departmentIds) as DepartmentId[], canonicalCategoryId: text(row.canonicalCategoryId), productType: text(row.productType), purchaseMode: row.purchaseMode === undefined ? 'buy' : row.purchaseMode as AuthoringFields['purchaseMode'], material: text(row.material), color: text(row.color), style: text(row.style), specs: stringRecord(row.specs), cultureIds: strings(row.cultureIds), regionIds: strings(row.regionIds), ceremonyIds: strings(row.ceremonyIds), revision: stockInteger(row.revision ?? 0, 'Revision'), discovery: { interests: strings(discovery.interests) } };
  if(row.bundleEligible!==undefined){if(typeof row.bundleEligible!=='boolean')throw new Error('Invalid bundle eligibility.');result.bundleEligible=row.bundleEligible;}
  if(row.bundleUnits!==undefined)result.bundleUnits=stockInteger(row.bundleUnits,'Bundle units');
  for (const key of ['ageMin','ageMax','yearMin','yearMax'] as const) if (discovery[key] !== undefined) result.discovery[key] = stockInteger(discovery[key],key);
  if (row.personalization !== undefined) {
    const schema = row.personalization as Record<string,unknown>;
    if (!schema || !Array.isArray(schema.fields)) throw new Error('Personalization requires a field list.');
    const keys = new Set<string>();
    result.personalization = { fields: schema.fields.map(raw => {
      if (!raw || typeof raw !== 'object') throw new Error('Invalid personalization field.');
      const f = raw as Record<string,unknown>, key = text(f.key), label = text(f.label);
      if (!key || !label || keys.has(key) || !['text','photo','choice'].includes(String(f.kind)) || ['__proto__','constructor','prototype'].includes(key)) throw new Error('Personalization fields need unique keys, labels and supported types.');
      keys.add(key);
      const choices = strings(f.choices);
      if(f.maxLength!==undefined && (Number(f.maxLength)<1 || Number(f.maxLength)>2000))throw new Error('Character limits must be 1–2000.');
      if (f.kind === 'choice' && !choices.length) throw new Error('Choice fields need options.');
      return { key, label, kind: f.kind as 'text'|'photo'|'choice', required: f.required === true, ...(f.maxLength !== undefined ? {maxLength:stockInteger(f.maxLength,'Character limit')} : {}), ...(choices.length ? {choices} : {}) };
    }), photoMaxBytes: stockInteger(schema.photoMaxBytes ?? 5*1024*1024,'Photo limit'), photoMimeTypes: strings(schema.photoMimeTypes ?? ['image/jpeg','image/png','image/webp']) };
    if (result.personalization.photoMaxBytes > 5*1024*1024 || result.personalization.photoMimeTypes.some(s => !['image/jpeg','image/png','image/webp'].includes(s))) throw new Error('Demo photos must be JPEG/PNG/WebP and at most 5 MB.');
  }
  if (row.bundle !== undefined) {
    const bundle = row.bundle as Record<string,unknown>;
    if (!bundle || !Array.isArray(bundle.components)) throw new Error('Bundle requires component SKUs.');
    const components = bundle.components.map(raw => { const c = raw as Record<string,unknown>; if (!c || !text(c.skuId)) throw new Error('Bundle components require SKU identities.');const quantity = stockInteger(c.quantity,'Component quantity');if (!quantity) throw new Error('Component quantity must be positive.'); return {skuId:text(c.skuId),quantity}; });
    if (new Set(components.map(c => c.skuId)).size !== components.length) throw new Error('Duplicate bundle component SKU.');
    result.bundle = { components, packagingFeePaise: stockInteger(bundle.packagingFeePaise ?? 0,'Packaging paise'), minItems: stockInteger(bundle.minItems ?? 1), maxItems: stockInteger(bundle.maxItems ?? 8), capacity: stockInteger(bundle.capacity ?? 10), allowedProductTypes: strings(bundle.allowedProductTypes) };
    if (!result.bundle.minItems || result.bundle.minItems > result.bundle.maxItems || !result.bundle.capacity) throw new Error('Invalid bundle capacity or item limits.');
  }
  if (row.sizeGuide !== undefined) {
    const guide = row.sizeGuide as Record<string,unknown>;
    if (!guide || guide.unit !== 'cm' || !Array.isArray(guide.rows)) throw new Error('Size guide requires centimetre rows.');
    result.sizeGuide = { unit:'cm', instructions:text(guide.instructions), rows:guide.rows.map(raw => { const r=raw as Record<string,unknown>; if (!r || !text(r.size) || !Number.isFinite(Number(r.chest)) || !Number.isFinite(Number(r.length)) || Number(r.chest)<=0 || Number(r.length)<=0) throw new Error('Invalid size guide measurements.');return {size:text(r.size),chest:Number(r.chest),length:Number(r.length)}; }) };
  }
  if(result.sizeGuide && new Set(result.sizeGuide.rows.map(r=>r.size.toLowerCase())).size!==result.sizeGuide.rows.length)throw new Error('Size guide labels must be unique.');
  validateAuthoring(result);
  return result;
}
export function validateCategoryPlacement(categories: AuthoringCategory[], proposed: AuthoringCategory): AuthoringCategory {
  if (!proposed.departmentId || !departmentIds.includes(proposed.departmentId)) throw new Error('Select a confirmed department.');
  const rows = new Map(categories.map(c => [c.id,c])); rows.set(proposed.id,proposed);
  if (!proposed.parentId && [...rows.values()].some(c => c.id !== proposed.id && c.active && !c.parentId && c.departmentId === proposed.departmentId)) throw new Error('This department already has a main category. Edit that main category instead.');
  const depth = (row: AuthoringCategory, seen = new Set<string>()): number => {
    if (seen.has(row.id)) throw new Error('Category hierarchy cannot contain a cycle.');
    seen.add(row.id);
    if (!row.parentId) return 1;
    const parent = rows.get(row.parentId);
    if (!parent || !parent.active || parent.departmentId !== row.departmentId) throw new Error('Parent must be active and in the same department.');
    return 1 + depth(parent,seen);
  };
  for (const row of rows.values()) {
    if (!row.departmentId) continue;
    const n = depth(row);
    if (n > 3) throw new Error('Catalogue allows Main → Subcategory → Child only.');
  }
  return { ...proposed, level: depth(proposed) as 1 | 2 | 3 };
}
