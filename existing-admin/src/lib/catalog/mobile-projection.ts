import {parseVisualMedia} from '@aarvika/catalogue/visual-commerce';
import {isCatalogueMedia,isImageKitReference} from '@aarvika/catalogue/media-policy';
import {getAdminDb} from '@/lib/firebase-admin';
import {demoSnapshot} from '@aarvika/catalogue/fixture-adapter';
import {adminEmulatorMeta,sharedCatalogueMeta,type CatalogueSnapshot} from '@aarvika/catalogue/api-contracts';
import type {Category,Product,Sku,Section} from '@aarvika/catalogue/contracts';
import type {CanonicalSkuRecord} from '@aarvika/catalogue/admin-contracts';
import {validateSnapshot} from '@aarvika/catalogue/validation';
import {normalizeHomepageSection} from '@/lib/admin/homepage';
import type {Product as AdminProduct} from './types';
const shared=process.env.AARVIKA_SHARED==='true';
const safeImage = shared?isImageKitReference:isCatalogueMedia;
function publishedVisual(value:unknown,legacyImage?:unknown,defaultAlt='Catalogue image'){
 const visual=value?parseVisualMedia(value):{};
 const image=visual.imagePath??legacyImage;
 return {...visual,images:visual.images?.filter(item=>safeImage(item.imagePath)),...(safeImage(image)?{imagePath:image,imageAlt:visual.imageAlt||defaultAlt}:{imagePath:undefined})};
}
function action(link:string){
 const legacy=link.match(/^\/(wedding|birthday|anniversary|hampers|personalised|personalized|clothing|stationery|furniture)$/);
 if(legacy)return '/department/'+(legacy[1]==='personalised'?'personalized':legacy[1]);
 if(/^\/(categories|search|builder|department\/(wedding|birthday|anniversary|hampers|personalized|clothing|stationery|furniture)|category\/[a-zA-Z0-9_-]+|product\/[a-zA-Z0-9_-]+|wedding\/(?:products|(?:tradition|function)\/[a-zA-Z0-9_-]+)|furniture\/(?:inquiry|requests))(\?[^\\\u0000-\u001f]*)?$/.test(link))return link;
 return '/categories';
}
/** Read-only projection. Original IDs survive; canonical SKU rows are the only stock/price source. */
export async function mobileProjection():Promise<{data:CatalogueSnapshot;diagnostics:{unmappedLegacyProducts:number}}>{
 const db=getAdminDb(),base=demoSnapshot();
 const [productSnap,skuSnap,categorySnap,collectionSnap,homeSnap,state,categoryCmsSnap]=await Promise.all([
  db.collection('products').get(),db.collection('skus').get(),db.collection('categories').get(),db.collection('collections').get(),db.collection('homepage_sections').get(),db.collection('homepage_catalogue').doc('state').get(),db.collection('taxonomy_page_merchandising').where('type','==','category').get(),
 ]);
 let categories=categorySnap.docs.slice().sort((a,b)=>Number(a.data().sortOrder??0)-Number(b.data().sortOrder??0)||a.id.localeCompare(b.id)).map(doc=>{const c=doc.data();return {id:doc.id,name:c.name,departmentId:c.departmentId,parentId:c.parentId??null,level:c.level,active:c.active,...(c.visualPublished||safeImage(c.image)?{visual:publishedVisual(c.visualPublished,c.image,`${c.name||'Category'} image`)}:{}),...(c.furnitureSector?{furnitureSector:c.furnitureSector}:{})};}).filter(c=>c.active&&c.departmentId) as Category[];
 for(let n=0;n<3;n++)categories=categories.filter(c=>!c.parentId||categories.some(p=>p.id===c.parentId&&p.active));
 const categoryIds=new Set(categories.map(c=>c.id)),collectionIds=new Set(collectionSnap.docs.filter(d=>d.data().active!==false).map(d=>d.id));
 const raw=productSnap.docs.map(d=>({id:d.id,...d.data()})) as AdminProduct[];
 let published=raw.filter(p=>p.status==='live'&&p.aarvika?.version===2&&categoryIds.has(p.aarvika.canonicalCategoryId));
 const canonical=skuSnap.docs.filter(d=>d.data().active!==false).map(d=>({id:d.id,...d.data()})) as CanonicalSkuRecord[];
 // A hidden component also hides dependent kits. Never retain a second stock pool.
 published=published.filter(p=>!p.aarvika!.bundle||p.aarvika!.bundle.components.every(c=>canonical.some(s=>s.id===c.skuId&&published.some(owner=>owner.id===s.productId&&owner.aarvikaSkuIds?.includes(s.id)))));
 const ids=new Set(published.map(p=>p.id));
 const skus:Sku[]=canonical.filter(s=>ids.has(s.productId)&&published.find(p=>p.id===s.productId)?.aarvikaSkuIds?.includes(s.id)).map(s=>({id:s.id,productId:s.productId,label:s.label,attributes:s.attributes,price:{amount:s.pricePaise,currency:'INR'},inventory:{skuId:s.id,available:Math.max(0,s.quantity-s.reserved),version:s.revision,demo:!shared}}));
 const schemas:CatalogueSnapshot['schemas']=[],bundleTemplates=shared?[]:base.bundleTemplates;
 const products:Product[]=published.map(p=>{
  const a=p.aarvika!,schemaId=`schema-${p.id}`;
  let schema=a.personalization;
  if(!schema&&p.personalization?.enabled)schema={fields:[...(p.personalization.fields??[]).map((label,i)=>({key:`legacy_${i+1}`,label,kind:'text' as const,required:true,maxLength:p.personalization.maxCharacters??p.personalization.maxLength??100})),...(p.personalization.imageUpload?[{key:'photo',label:'Photo',kind:'photo' as const,required:false}]:[])],photoMaxBytes:5*1024*1024,photoMimeTypes:['image/jpeg','image/png','image/webp']};
  if(schema)schemas.push({id:schemaId,...schema,preview:'template'});
  const templateId=`kit-${p.id}`;
  if(a.bundle)bundleTemplates.push({id:templateId,title:p.title,minItems:a.bundle.minItems,maxItems:a.bundle.maxItems,capacity:a.bundle.capacity,packagingFee:a.bundle.packagingFeePaise,allowedProductTypes:a.bundle.allowedProductTypes.length?a.bundle.allowedProductTypes:[...new Set(published.filter(owner=>!owner.aarvika!.bundle&&owner.aarvika!.purchaseMode==='buy').map(owner=>owner.aarvika!.productType))]});
  return {id:p.id,title:p.title,description:p.description,departmentIds:a.departmentIds,categoryIds:p.categoryIds.filter(id=>categoryIds.has(id)),collectionIds:p.collectionIds.filter(id=>collectionIds.has(id)),occasionIds:p.occasionIds,recipientIds:[...new Set([...p.recipientIds,...(a.specs.Recipient?[a.specs.Recipient]:[])])],cultureIds:[...new Set([...a.cultureIds,...p.cultureTagIds??[]])],ceremonyIds:a.ceremonyIds,productType:a.productType,style:a.style,material:a.material||a.specs.Material||a.specs.Fabric||'',color:a.color,glyph:'◇',art:'lavender',specs:{...a.specs,...(a.departmentIds.includes('furniture')?{...(a.specs.Material||!a.material?{}:{Material:a.material}),...(a.specs.Style||!a.style?{}:{Style:a.style})}:{}),...(a.regionIds.length?{Region:a.regionIds.join(', ')}:{})},skuIds:(p.aarvikaSkuIds??[]).filter(id=>skus.some(s=>s.id===id&&s.productId===p.id)),...(schema?{personalizationSchemaId:schemaId}:{}),bundleEligible:a.purchaseMode==='buy'&&!a.bundle&&(a.bundleEligible??!['furniture','fashion','clothing'].includes(a.productType)),bundleUnits:a.bundleUnits??1,purchaseMode:a.purchaseMode,demo:!shared,discovery:a.discovery,sizeGuide:a.sizeGuide,media:p.images.filter(i=>safeImage(i.url)&&i.url!=="/file.svg").map(i=>({path:i.url,alt:i.alt||p.title+' image'})),...(a.bundle?{prebuiltBundle:{templateId,components:a.bundle.components.map(c=>({...c,personalization:{},media:[]})),packaging:a.specs.Packaging==='Mint wrap'?'Mint wrap':'Lavender box',message:''}}:{})};
 });
 const publishedProductIds=new Set(products.map(product=>product.id));
 categories=categories.map(category=>{
  const page=categoryCmsSnap.docs.find(doc=>doc.data().taxonomyId===category.id&&doc.data().active!==false)?.data();
  if(!page)return category;
  const heroImage=safeImage(page.heroImage)?page.heroImage:undefined;
  const bannerImage=safeImage(page.bannerImage)?page.bannerImage:undefined;
  return {...category,page:{
   ...((page.heroTitle||page.heroDescription||heroImage)?{hero:{title:String(page.heroTitle||category.name),subtitle:String(page.heroDescription||''),...(heroImage?{imagePath:heroImage,imageAlt:`${page.heroTitle||category.name} hero image`}:{})}}:{}),
   ...((page.bannerTitle||page.bannerDescription||bannerImage)?{banner:{title:String(page.bannerTitle||''),subtitle:String(page.bannerDescription||''),...(bannerImage?{imagePath:bannerImage,imageAlt:`${page.bannerTitle||category.name} banner image`}:{})}}:{}),
   featuredProductIds:Array.isArray(page.featuredProductIds)?page.featuredProductIds.filter((id:unknown):id is string=>typeof id==='string'&&publishedProductIds.has(id)):[],
   featuredCategoryIds:Array.isArray(page.featuredCategoryIds)?page.featuredCategoryIds.filter((id:unknown):id is string=>typeof id==='string'&&categoryIds.has(id)):[],
  }};
 });
 const collections=collectionSnap.docs.slice().sort((a,b)=>Number(a.data().sortOrder??0)-Number(b.data().sortOrder??0)||a.id.localeCompare(b.id)).filter(d=>collectionIds.has(d.id)).map(d=>({id:d.id,title:String(d.data().name??d.data().title??d.id),...(d.data().visualPublished||safeImage(d.data().image)?{visual:publishedVisual(d.data().visualPublished,d.data().image,`${d.data().name??d.data().title??'Collection'} image`)}:{}),productIds:products.filter(p=>p.collectionIds.includes(d.id)).map(p=>p.id)}));
 const homes=homeSnap.docs.map(d=>normalizeHomepageSection(d.id,d.data())).filter(s=>s.status==='published');
 const sections:Section[]=homes.map(h=>{
  const ref=`homepage-${h.id}`,selection=h.selection??'manual';
  const selected=products.filter(p=>h.sourceId==='@department'?p.departmentIds.includes(h.pageKey?.split(':')[1] as Product['departmentIds'][number]):h.type==='collection'?p.collectionIds.includes(h.sourceId??''):selection==='featured'?published.find(r=>r.id===p.id)?.featured:selection==='new-arrivals'?published.find(r=>r.id===p.id)?.newArrival:selection==='best-sellers'?false:(h.productIds??[]).includes(p.id)).slice(0,h.limit??8);
  if((h.type==='products'||h.type==='collection')&&h.sourceId!=='@collections'){collections.push({id:ref,title:h.title,productIds:selected.map(p=>p.id)});for(const p of selected)p.collectionIds.push(ref);}
  return {pageKey:h.pageKey,imageAlt:h.imageAlt,imageFit:h.imageFit,illustration:h.illustration,id:h.id,type:h.type==='categories'?'departments':h.sourceId==='@collections'?'collection':h.type==='products'||h.type==='collection'?'products':h.type==='hero'?'hero':'collection',title:h.title,subtitle:h.subtitle,buttonLabel:h.buttonLabel,imagePath:safeImage(h.imageUrl)?h.imageUrl:undefined,dataSourceRef:h.sourceId?.startsWith('@')?h.sourceId:h.type==='products'||h.type==='collection'?ref:h.sourceId||'',categoryId:h.type==='categories'&&h.sourceId&&!h.sourceId.startsWith('@')?h.sourceId:undefined,productIds:selected.map(p=>p.id),limit:h.limit,order:h.sortOrder,enabled:h.isActive,responsivePresentation:'compact',action:!h.linkUrl&&(h.type==='products'||h.type==='collection')?`/search?collectionId=${encodeURIComponent(ref)}`:action(h.linkUrl)};
 });
 const merchandising=await Promise.all((['wedding','birthday','anniversary','hampers','personalised','clothing','stationery','furniture'] as const).map(async page=>({page,config:(await db.collection('merchandising_pages').doc(page).get()).data(),items:(await db.collection('merchandising_pages').doc(page).collection('items').get()).docs.map(doc=>({id:doc.id,...doc.data()} as Record<string,unknown>&{id:string}))})));
 const merchSections=new Map<string,Section[]>();
 for(const entry of merchandising){
  const department=entry.page==='personalised'?'personalized':entry.page,key=`department:${department}`;
  if(!entry.config&&!entry.items.length)continue;
  const hero=entry.config?.hero as Record<string,unknown>|undefined;
  const activeItems=entry.items.filter(item=>item.active!==false).sort((a,b)=>Number(a.sortOrder??0)-Number(b.sortOrder??0));
  const shown:Section[]=[];
  if(hero?.active!==false){const image=safeImage(hero?.mobileImage)?hero.mobileImage:safeImage(hero?.desktopImage)?hero.desktopImage:undefined;shown.push({id:`merch-${department}-hero`,type:'hero',title:String(hero?.heading||base.departments.find(d=>d.id===department)?.title||department),subtitle:String(hero?.description||''),imagePath:image,imageAlt:image?String(hero?.heading||department):undefined,dataSourceRef:'',order:0,enabled:true,responsivePresentation:'compact',action:`/search?departmentId=${department}`});}
  for(const type of [...new Set(activeItems.map(item=>String(item.type)))]){
   const items=activeItems.filter(item=>item.type===type);
   const featuredIds=[...new Set(items.flatMap(item=>Array.isArray(item.featuredProductIds)?item.featuredProductIds:[]))].filter((id):id is string=>typeof id==='string'&&publishedProductIds.has(id));
   if((type==='featured'||type==='curated')&&featuredIds.length){shown.push({id:`merch-${department}-${type}`,type:'products',title:type==='featured'?'Featured gifts':'Curated gifts',dataSourceRef:'@merchandising',productIds:featuredIds,order:shown.length*10,enabled:true,responsivePresentation:'compact',action:`/search?departmentId=${department}`});continue;}
   const shortcuts=items.map(item=>{
    const related=String(item.relatedId||''),title=String(item.name||'');
    const link=type==='category'&&categoryIds.has(related)?`/category/${related}`:type==='collection'&&collectionIds.has(related)?`/search?collectionId=${encodeURIComponent(related)}`:type==='budget'&&Number(item.max)>0?`/search?departmentId=${department}&maxPrice=${Math.round(Number(item.max)*100)}`:type==='recipient'||type==='lovedOne'?`/search?departmentId=${department}&recipient=${encodeURIComponent(title)}`:type==='ageGroup'&&Number.isFinite(Number(item.minimumAge))?`/search?departmentId=${department}&age=${Number(item.minimumAge)}`:type==='milestone'&&Number.isFinite(Number(item.years))?`/search?departmentId=${department}&year=${Number(item.years)}`:`/search?departmentId=${department}&text=${encodeURIComponent(title)}`;
    return {title,action:link,...(safeImage(item.image)?{imagePath:item.image,imageAlt:title}:{})};
   });
   shown.push({id:`merch-${department}-${type}`,type:'departments',title:type==='category'?'Shop by category':type==='collection'?'Featured collections':type==='budget'?'Shop by budget':type==='state'?'Explore states':type==='culture'?'Explore traditions':type==='recipient'||type==='lovedOne'?'Shop by recipient':type==='ageGroup'?'Shop by age':type==='milestone'?'Milestones':type==='featured'?'Featured':type==='curated'?'Curated sets':type==='giftType'?'Gift types':type==='promotion'?'Highlights':type==='event'?'Wedding functions':type,dataSourceRef:'@merchandising',shortcuts,order:shown.length*10,enabled:true,responsivePresentation:'compact',action:`/search?departmentId=${department}`});
  }
  shown.push({id:`merch-${department}-families`,type:'departments',title:'Explore categories',dataSourceRef:'@families',order:900,enabled:true,responsivePresentation:'compact',action:`/search?departmentId=${department}`});
  shown.push({id:`merch-${department}-products`,type:'products',title:'Shop all',dataSourceRef:'@department',order:1000,enabled:true,responsivePresentation:'compact',action:`/search?departmentId=${department}`});
  merchSections.set(key,shown);
 }
 const data:CatalogueSnapshot={...base,meta:shared?sharedCatalogueMeta:adminEmulatorMeta,categories,products,skus,schemas,bundleTemplates,collections,commercePages:[...new Set([...base.commercePages?.map(p=>p.key)??[],...state.data()?.pageKeys??[],...sections.map(s=>s.pageKey||'home'),...merchSections.keys()])].filter(key=>key!=='home').map(key=>({key,sections:(()=>{const manual=sections.filter(s=>s.pageKey===key),merch=merchSections.get(key)??[];if(merch.length)return [...merch.filter(s=>s.type!=='hero'||!manual.some(item=>item.type==='hero')),...manual];return manual.length||state.data()?.pageKeys?.includes(key)?manual:shared?[]:base.commercePages?.find(p=>p.key===key)?.sections??[];})()})),layout:{id:'admin-home',version:Number(state.data()?.version??0),sections:sections.filter(s=>!s.pageKey||s.pageKey==='home').length||shared?sections.filter(s=>!s.pageKey||s.pageKey==='home'):base.layout.sections.filter(s=>s.type==='hero'||s.type==='departments')},wedding:{...base.wedding,ceremonyNeeds:base.wedding.ceremonyNeeds.map(n=>({...n,eligibleSkuIds:products.filter(p=>p.departmentIds.includes('wedding')&&p.productType===n.productType).flatMap(p=>p.skuIds)}))}};
 validateSnapshot(data,shared?'shared-api':'admin-emulator');
 return {data,diagnostics:{unmappedLegacyProducts:raw.filter(p=>!p.aarvika).length}};
}
