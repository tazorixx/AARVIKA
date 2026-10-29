import {parseVisualMedia,validPageKey} from './visual-commerce.ts';
import {isCatalogueMedia} from './media-policy.ts';
import type { CatalogueSnapshot } from './api-contracts.ts';
import { CatalogueError, validateMeta,validateAdminEmulatorMeta,validateSharedCatalogueMeta } from './api-contracts.ts';

function requireValue(ok: unknown): asserts ok { if (!ok) throw new CatalogueError('INVALID_RESPONSE', 'Invalid or inconsistent demo catalogue response.'); }
const record = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const safeImage = isCatalogueMedia;
const strings = (v: unknown): v is string[] => Array.isArray(v) && v.every(x=>typeof x==='string');
export function validateSnapshot(value: unknown,source:'local-api'|'admin-emulator'|'shared-api'='local-api'): asserts value is CatalogueSnapshot {
  requireValue(record(value)); if(source==='admin-emulator')validateAdminEmulatorMeta(value.meta);else if(source==='shared-api')validateSharedCatalogueMeta(value.meta);else validateMeta(value.meta);
  const data = value as unknown as CatalogueSnapshot;
  for (const key of ['departments','categories','products','skus','schemas','bundleTemplates','collections','clothingColumns'] as const) requireValue(Array.isArray(data[key]));
  const unique = (items: {id:string}[]) => { requireValue(items.every(i=>record(i)&&typeof i.id==='string')); requireValue(new Set(items.map(i=>i.id)).size===items.length); };
  for (const items of [data.departments,data.categories,data.products,data.skus,data.schemas,data.bundleTemplates,data.collections]) unique(items);
  requireValue(data.departments.length===8 && ['wedding','birthday','personalized','anniversary','hampers','clothing','stationery','furniture'].every(id=>data.departments.some(d=>d.id===id&&d.active&&typeof d.title==='string')));
  for(const c of data.categories) requireValue(typeof c.name==='string' && [1,2,3].includes(c.level) && data.departments.some(d=>d.id===c.departmentId) && (c.parentId===null ? c.level===1 : data.categories.some(p=>p.id===c.parentId&&p.level===c.level-1&&p.departmentId===c.departmentId)));
  for(const c of [...data.categories,...data.collections])if(c.visual)parseVisualMedia(c.visual);
  for(const c of data.categories)if(c.page){
    if(c.page.hero)parseVisualMedia(c.page.hero);
    if(c.page.banner)parseVisualMedia(c.page.banner);
    requireValue(strings(c.page.featuredProductIds)&&c.page.featuredProductIds.every(id=>data.products.some(product=>product.id===id)));
    requireValue(strings(c.page.featuredCategoryIds)&&c.page.featuredCategoryIds.every(id=>data.categories.some(category=>category.id===id)));
  }
  if(data.commercePages!==undefined){requireValue(Array.isArray(data.commercePages)&&new Set(data.commercePages.map(p=>p.key)).size===data.commercePages.length);for(const p of data.commercePages)requireValue(validPageKey(p.key)&&Array.isArray(p.sections));}
  for(const p of data.products) {
    requireValue(p.demo===(source!=='shared-api') && typeof p.title==='string' && typeof p.description==='string' && typeof p.glyph==='string' && typeof p.art==='string' && typeof p.productType==='string' && record(p.specs));
    for(const values of [p.departmentIds,p.categoryIds,p.collectionIds,p.skuIds,p.occasionIds,p.recipientIds,p.cultureIds,p.ceremonyIds]) requireValue(strings(values));
    requireValue(['buy','inquiry'].includes(p.purchaseMode) && p.departmentIds.every(id=>data.departments.some(d=>d.id===id)) && p.categoryIds.every(id=>data.categories.some(c=>c.id===id)) && p.skuIds.every(id=>data.skus.some(s=>s.id===id&&s.productId===p.id)));
    if(p.media!==undefined)requireValue(Array.isArray(p.media)&&p.media.every(m=>record(m)&&safeImage(m.path)&&typeof m.alt==='string'));
    requireValue(!p.personalizationSchemaId || data.schemas.some(s=>s.id===p.personalizationSchemaId));
    if(p.prebuiltBundle) requireValue(data.bundleTemplates.some(t=>t.id===p.prebuiltBundle?.templateId) && p.prebuiltBundle.components.every(c=>data.skus.some(s=>s.id===c.skuId)&&Number.isInteger(c.quantity)&&c.quantity>0));
  }
  for(const s of data.skus) requireValue(data.products.some(p=>p.id===s.productId&&p.skuIds.includes(s.id)) && typeof s.label==='string' && record(s.attributes) && s.price?.currency==='INR' && Number.isSafeInteger(s.price.amount) && s.price.amount>=0 && s.inventory?.skuId===s.id && s.inventory.demo===(source!=='shared-api') && Number.isSafeInteger(s.inventory.available)&&s.inventory.available>=0);
  for(const c of data.collections) requireValue(typeof c.title==='string'&&strings(c.productIds)&&c.productIds.every(id=>data.products.some(p=>p.id===id&&p.collectionIds.includes(c.id))));
  requireValue(record(data.layout)&&Array.isArray(data.layout.sections));
  for(const s of [...data.layout.sections,...(data.commercePages??[]).flatMap(p=>p.sections)]) requireValue(typeof s.id==='string'&&typeof s.title==='string'&&typeof s.action==='string'&&/^\/(?!\/)/.test(s.action)&&!/[\\\u0000-\u001f]/.test(s.action)&&['hero','departments','products','collection','combo'].includes(s.type));
  for(const s of [...data.layout.sections,...(data.commercePages??[]).flatMap(p=>p.sections)]){if(s.imagePath!==undefined)requireValue(safeImage(s.imagePath));if(s.mobileImagePath!==undefined)requireValue(safeImage(s.mobileImagePath));if(s.productIds!==undefined)requireValue(strings(s.productIds)&&s.productIds.every(id=>data.products.some(p=>p.id===id)));if(s.categoryId)requireValue(data.categories.some(c=>c.id===s.categoryId));}
  for(const s of [...data.layout.sections,...(data.commercePages??[]).flatMap(p=>p.sections)])if(s.shortcuts!==undefined)requireValue(Array.isArray(s.shortcuts)&&s.shortcuts.every(shortcut=>typeof shortcut.title==='string'&&typeof shortcut.action==='string'&&/^\/(?!\/)/.test(shortcut.action)&&(!shortcut.imagePath||safeImage(shortcut.imagePath))));
  for(const s of data.schemas) requireValue(Array.isArray(s.fields)&&s.fields.every(f=>typeof f.key==='string'&&typeof f.label==='string'&&['text','photo','choice'].includes(f.kind)));
  for(const t of data.bundleTemplates) requireValue(Number.isSafeInteger(t.packagingFee)&&t.packagingFee>=0&&strings(t.allowedProductTypes));
  requireValue(record(data.wedding)&&Array.isArray(data.wedding.traditions)&&Array.isArray(data.wedding.ceremonies)&&Array.isArray(data.wedding.ceremonyNeeds)&&Array.isArray(data.wedding.weddingLanes));
  for(const n of data.wedding.ceremonyNeeds) requireValue(strings(n.eligibleSkuIds)&&n.eligibleSkuIds.every(id=>data.skus.some(s=>s.id===id)));
  requireValue(data.clothingColumns.length===8&&data.clothingColumns.every(c=>typeof c.name==='string'&&strings(c.children)));
}
