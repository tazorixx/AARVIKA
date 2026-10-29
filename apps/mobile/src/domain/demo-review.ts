import type { Address, BundleTemplate, CartLine, Money, PersonalizationSchema, Product, Sku } from './contracts';
import { addLine, validateAddress, validateCart } from './cart.ts';
import { previewBundle } from './bundles.ts';
import { validatePersonalization } from './personalization.ts';
export interface DemoReview { id: string; at: string; status: 'local-review'; payment: 'disabled'; address: Address; lines: CartLine[]; subtotal: Money; fingerprint: string }
export function cartFingerprint(lines: CartLine[]) { return JSON.stringify(lines); }
export function changeCartVariant(lines: CartLine[], id: string, skuId: string, skus: Sku[]) {
  const line=lines.find(l=>l.id===id), old=skus.find(s=>s.id===line?.skuId), next=skus.find(s=>s.id===skuId);
  if(!line||line.bundle||!old||!next||old.productId!==next.productId)throw new Error('Choose a variant of this product.');
  return addLine(lines.filter(l=>l.id!==id),{...line,skuId:next.id,previewUnitPrice:next.price},skus).map(l=>l.skuId===next.id?{...l,previewUnitPrice:next.price}:l);
}
export function buildDemoReview(input: { lines: CartLine[]; addresses: Address[]; addressId: string; products: Product[]; skus: Sku[]; schemas: PersonalizationSchema[]; templates: BundleTemplate[]; id: string; at: string }): DemoReview {
  const {lines,addresses,addressId,products,skus,schemas,templates,id,at}=input;
  if(!lines.length)throw new Error('Add something to your demo cart first.');
  const address=addresses.find(a=>a.id===addressId);if(!address)throw new Error('Select a sample address from this profile.');
  const addressError=validateAddress(address);if(addressError)throw new Error(addressError);
  const issues=validateCart(lines,skus);if(issues.length)throw new Error(issues[0]);
  const reviewed=lines.map(line=>{
    if(line.bundle)return {...line,previewUnitPrice:previewBundle(line.bundle,templates,products,skus,schemas)};
    const sku=skus.find(s=>s.id===line.skuId)!,product=products.find(p=>p.id===sku.productId);
    if(!product||product.purchaseMode!=='buy')throw new Error('This item needs an inquiry, not an order review.');
    const schema=schemas.find(s=>s.id===product.personalizationSchemaId);
    if(schema){const errors=validatePersonalization(schema,line.personalization,line.media);if(errors.length)throw new Error(errors[0]);}
    return {...line,previewUnitPrice:sku.price};
  });
  return JSON.parse(JSON.stringify({id,at,status:'local-review',payment:'disabled',address,lines:reviewed,subtotal:{amount:reviewed.reduce((n,l)=>n+l.previewUnitPrice.amount*l.quantity,0),currency:'INR'},fingerprint:cartFingerprint(lines)}));
}
