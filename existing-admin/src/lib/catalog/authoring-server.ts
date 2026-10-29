import { createHash } from 'node:crypto';
import { FieldValue, type Firestore, type Transaction, type DocumentReference } from 'firebase-admin/firestore';
import { rupeesToPaise, stockInteger, variantCombination, validateAuthoring, validateCategoryPlacement, type AuthoringCategory, type CanonicalSkuRecord } from '@aarvika/catalogue/admin-contracts';
import type { Product } from './types';

type Input = Omit<Product,'id'|'createdAt'|'updatedAt'>;
const codeKey = (code: string) => createHash('sha256').update(code.trim().toLowerCase()).digest('hex');

/** Read/validate everything before returning a write plan for the caller's transaction. */
export async function prepareAuthoring(tx: Transaction, db: Firestore, productId: string, input: Input, old?: Product) {
  if (!input.aarvika) return null;
  const fields = input.aarvika;
  validateAuthoring(fields, input.status === 'live');
  const revision = old?.aarvika?.revision ?? 0;
  if (fields.revision !== revision) throw new Error('This product changed elsewhere. Reload before saving.');
  const categorySnapshot = await tx.get(db.collection('categories'));
  const categories = categorySnapshot.docs.map(d => ({id:d.id,...d.data()})) as AuthoringCategory[];
  const byId = new Map(categories.map(c => [c.id,c]));
  const categoryIds = new Set(input.categoryIds);
  if (fields.canonicalCategoryId) categoryIds.add(fields.canonicalCategoryId);
  if (input.status === 'live') {
    const canonical = byId.get(fields.canonicalCategoryId);
    if (!canonical?.active || !canonical.departmentId || !fields.departmentIds.includes(canonical.departmentId)) throw new Error('Select an active canonical category in a selected department.');
  }
  for (const id of [...categoryIds]) {
    let category = byId.get(id), depth = 0;
    if (!category) { if (input.status === 'live') throw new Error('A selected category no longer exists.'); continue; }
    if (input.status === 'live' && (!category.active || !category.departmentId || !fields.departmentIds.includes(category.departmentId))) throw new Error('Published category placements must be active and match selected departments.');
    while (category?.parentId) {
      if (++depth >= 3) throw new Error('Invalid category hierarchy.');
      categoryIds.add(category.parentId); category = byId.get(category.parentId);
    }
  }
  const oldSkus = await tx.get(db.collection('skus').where('productId','==',productId));
  const previous = new Map(oldSkus.docs.map(d => [d.id,d.data() as CanonicalSkuRecord]));
  const variants = input.variants;
  if (input.status === 'draft' && (!input.sku || variants.some(v=>!v.sku))) return {
    patch:{aarvika:{...fields,revision:revision+1},categoryIds:[...categoryIds],aarvikaSkuIds:old?.aarvikaSkuIds ?? [],inventory:old?.inventory ?? input.inventory},
    write() { /* Incomplete draft configuration does not mutate canonical stock. */ },
  };
  if (!old?.aarvika && variants.length && ((old?.inventory.reserved ?? 0)>0 || (old?.inventory.sold ?? 0)>0)) throw new Error('Legacy reserved/sold stock needs an explicit SKU mapping before conversion. No history was changed.');
  const rows = fields.purchaseMode === 'inquiry' || fields.bundle ? [] : variants.length ? variants.map((v,i) => {
    const legacyId = v.id || `variant-${i+1}`;
    if (!/^[a-zA-Z0-9_-]{1,120}$/.test(legacyId)) throw new Error('Invalid immutable variant identity.');
    return { id:`sku-${productId}-${legacyId}`, code:v.sku!.trim(), label:v.value ? `${v.name} · ${v.value}` : v.name, attributes:v.attributes && Object.keys(v.attributes).length ? v.attributes : {[v.name]:v.value || v.name}, pricePaise:rupeesToPaise(v.price ?? (input.price+(v.priceDelta ?? 0))), quantity:stockInteger(v.quantity ?? previous.get(`sku-${productId}-${legacyId}`)?.quantity ?? 0) };
  }) : [{ id:`sku-${productId}-default`, code:input.sku.trim(), label:'Standard', attributes:{}, pricePaise:rupeesToPaise(input.price), quantity:stockInteger(input.inventory.quantity) }];
  const records: CanonicalSkuRecord[] = rows.map(row => {
    const current = previous.get(row.id);
    const reserved = current?.reserved ?? (!variants.length ? old?.inventory.reserved ?? 0 : 0);
    if(current&&(reserved>0||current.sold>0)&&variantCombination(current.attributes)!==variantCombination(row.attributes))throw new Error('A SKU with reserved or sold history cannot change its physical combination. Add a new SKU instead.');
    if (row.quantity < reserved) throw new Error('SKU quantity cannot be lower than reserved stock.');
    if (input.status === 'live' && row.pricePaise <= 0) throw new Error('Published sellable SKUs require a positive price.');
    return { ...row, version:2, productId, currency:'INR', reserved, sold:current?.sold ?? (!variants.length ? old?.inventory.sold ?? 0 : 0), revision:(current?.revision ?? 0)+1 };
  });
  for (const row of previous.values()) if (!records.some(s=>s.id===row.id) && row.reserved > 0) throw new Error('A reserved SKU cannot be removed or changed to inquiry-only.');
  // Legacy data has no SKU index. Inspect it during local activation rather than
  // silently claiming its codes are available; no migration/cloud write is run.
  const legacy = await tx.get(db.collection('products'));
  const otherCodes = new Set(legacy.docs.filter(d => d.id !== productId).flatMap(d => {
    const p = d.data() as Product; return [p.sku,...(p.variants ?? []).map(v => v.sku)].filter((v):v is string => !!v).map(v => v.trim().toLowerCase());
  }));
  const locks: { ref: DocumentReference; skuId: string|null }[] = [];
  const parentCode=input.sku.trim().toLowerCase();
  if(otherCodes.has(parentCode))throw new Error('Product reference SKU code is already used.');
  const parentRef=db.collection('sku_codes').doc(codeKey(parentCode)),parentLock=await tx.get(parentRef);
  if(parentLock.exists&&parentLock.data()?.productId!==productId)throw new Error('Product reference SKU code is already reserved.');
  if(!records.some(row=>row.code.toLowerCase()===parentCode))locks.push({ref:parentRef,skuId:parentLock.data()?.skuId??null});
  for (const row of records) {
    if (otherCodes.has(row.code.toLowerCase())) throw new Error(`SKU code is already used: ${row.code}`);
    const ref = db.collection('sku_codes').doc(codeKey(row.code)), snap = await tx.get(ref);
    if (snap.exists && (snap.data()?.productId !== productId || snap.data()?.skuId && snap.data()?.skuId !== row.id)) throw new Error(`SKU code is already reserved: ${row.code}`);
    locks.push({ref,skuId:row.id});
  }
  let bundlePrice=fields.bundle?.packagingFeePaise ?? 0, bundleUnits=0;
  for (const component of fields.bundle?.components ?? []) {
    const snap = await tx.get(db.collection('skus').doc(component.skuId));
    if (!snap.exists || snap.data()?.productId === productId || snap.data()?.active === false) throw new Error('Bundle components must reference existing active SKUs from other products.');
    const owner=await tx.get(db.collection('products').doc(snap.data()!.productId));
    if(!owner.exists || owner.data()?.aarvika?.bundle || (input.status==='live' && owner.data()?.status!=='live'))throw new Error('Publishable components must belong to published products; nested bundles are not supported.');
    if(fields.bundle!.allowedProductTypes.length && !fields.bundle!.allowedProductTypes.includes(owner.data()?.aarvika?.productType))throw new Error('Component type is outside bundle constraints.');
    const settings=owner.data()!.aarvika;
    if(!(settings.bundleEligible??!['furniture','fashion','clothing'].includes(settings.productType)))throw new Error('Component is not eligible for kits/hampers.');
    bundleUnits+=component.quantity*(settings.bundleUnits??1);
    bundlePrice+=snap.data()!.pricePaise*component.quantity;
  }
  if(fields.bundle&&bundleUnits>fields.bundle.capacity)throw new Error('Component units exceed bundle capacity.');
  const inventory = { quantity:records.reduce((n,s)=>n+s.quantity,0), reserved:records.reduce((n,s)=>n+s.reserved,0), sold:records.reduce((n,s)=>n+s.sold,0)+[...previous.values()].filter(s=>!records.some(r=>r.id===s.id)).reduce((n,s)=>n+s.sold,0) };
  return {
    patch:{ ...(fields.bundle?{price:bundlePrice/100}:{}), aarvika:{...fields,revision:revision+1}, aarvikaSkuIds:records.map(s=>s.id), categoryIds:[...categoryIds], inventory },
    write() {
      for (const row of records) tx.set(db.collection('skus').doc(row.id),{...row,active:true,updatedAt:FieldValue.serverTimestamp()});
      for (const lock of locks) tx.set(lock.ref,{productId,skuId:lock.skuId});
      for (const row of previous.values()) if (!records.some(s=>s.id===row.id)) tx.update(db.collection('skus').doc(row.id),{active:false,updatedAt:FieldValue.serverTimestamp()});
      tx.set(db.collection('inventory').doc(productId),{productId,...inventory,projectionOf:'skus',updatedAt:FieldValue.serverTimestamp()},{merge:true});
    },
  };
}

export async function prepareCategory(tx: Transaction, db: Firestore, id: string, data: Partial<AuthoringCategory>, old?: AuthoringCategory) {
  if (data.active === false) {
    const children = await tx.get(db.collection('categories').where('parentId','==',id));
    if (children.docs.some(d=>d.data().active !== false)) throw new Error('Reassign or archive child categories first.');
    const references = await tx.get(db.collection('products').where('categoryIds','array-contains',id));
    if (!references.empty) throw new Error('Reassign referenced products before archiving this category.');
  }
  if (!data.departmentId && !old?.departmentId) return data;
  const snapshot = await tx.get(db.collection('categories'));
  const rows = snapshot.docs.map(d=>({id:d.id,...d.data()})) as AuthoringCategory[];
  return validateCategoryPlacement(rows,{...old,...data,id} as AuthoringCategory);
}
