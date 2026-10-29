/* eslint-disable @typescript-eslint/no-require-imports -- Direct Node CommonJS launcher. */
const { isolatedEnv } = require('./isolated-env.cjs');
Object.assign(process.env, isolatedEnv());
const { getAdminAuth, getAdminDb } = require('../src/lib/firebase-admin.ts');
async function seed() {
  const auth = getAdminAuth(), db = getAdminDb();
  for (const [uid, email, role] of [['local-owner', 'owner@aarvika.invalid', 'SUPER_ADMIN'], ['local-support', 'support@aarvika.invalid', 'SUPPORT'], ['local-catalogue','catalogue@aarvika.invalid','CATALOG_MANAGER']]) {
    const user = { uid, email, password: 'Local-demo-only-2026!', displayName: 'Local Demo ' + role, emailVerified: true };
    try { await auth.createUser(user); } catch (error) { if (error.code !== 'auth/uid-already-exists') throw error; }
    await auth.setCustomUserClaims(uid, { role });
  }
  for (const collection of ['categories', 'occasions', 'recipients', 'collections']) {
    await db.collection(collection).doc('local-demo').set({ name: 'Local demo', slug: 'local-demo', active: true, sortOrder: 0, ...(collection === 'categories' ? { parentId: null } : {}) });
  }
  const snapshot = require("../../packages/catalogue/src/fixture-adapter.ts").demoSnapshot();
  const taxonomy = snapshot.categories;
  const existingCategoryIds=new Set((await db.collection('categories').get()).docs.map(doc=>doc.id));
  for (let start=0;start<taxonomy.length;start+=400) { const batch=db.batch(); for (const [offset,category] of taxonomy.slice(start,start+400).entries()) { const {id,...data}=category; if(existingCategoryIds.has(id))continue; batch.set(db.collection("categories").doc(id),{...data,...(data.departmentId==='furniture'&&data.level===2?{furnitureSector:Number(id.split('-')[1])<=9?'Home':'Commercial'}:{}),slug:id,sortOrder:start+offset,description:"Approved source taxonomy · isolated demo"},{merge:true}); } await batch.commit(); }
  const product = { sku: 'LOCAL-DEMO-001', title: 'Demo keepsake · local test data', slug: 'local-demo-keepsake', shortDescription: 'Emulator test record', description: 'Demo placeholder only; not a merchant listing.', categoryIds: ['local-demo'], occasionIds: ['local-demo'], recipientIds: ['local-demo'], collectionIds: ['local-demo'], tagIds: [], cultureTagIds: [], stateTagIds: [], images: [{ url: '/file.svg', alt: 'Local demo placeholder' }], thumbnail: '/file.svg', price: 199, mrp: 199, discount: 0, variants: [], personalization: { enabled: false, fields: [] }, inventory: { quantity: 10, reserved: 0, sold: 0 }, delivery: {}, serviceability: { nationwide: false, pincodes: [], cities: [] }, status: 'live', featured: false, bestseller: false, newArrival: false, rating: 0, reviewCount: 0, seo: {}, updatedAt: new Date(), createdAt: new Date() };
  await db.collection('products').doc('local-demo-product').set(product);
  await db.collection('inventory').doc('local-demo-product').set({ productId: 'local-demo-product', ...product.inventory });
  const {createProduct}=require('../src/lib/catalog/server.ts');
  const {parseProductInput}=require('../src/lib/catalog/validation.ts');
  const {blankAuthoring}=require('../../packages/catalogue/src/admin-contracts.ts');
  const collectionRef=db.collection('collections').doc('thoughtful');
  if(!(await collectionRef.get()).exists)await collectionRef.set({name:'Thoughtfully picked · demo',slug:'thoughtful',active:true,sortOrder:1});
  let added=0;
  for(const source of snapshot.products.slice(0,16)){
    const slug='demo-source-'+source.id;
    if(!(await db.collection('products').where('slug','==',slug).limit(1).get()).empty)continue;
    const variants=snapshot.skus.filter(s=>s.productId===source.id).map(s=>({id:s.id,name:s.label,sku:'DEMO-'+s.id.toUpperCase(),price:s.price.amount/100,quantity:s.inventory.available,attributes:Object.fromEntries(Object.entries(s.attributes).map(([k,v])=>[k==='size'?'Size':k,v]))}));
    const schema=snapshot.schemas.find(s=>s.id===source.personalizationSchemaId);
    const art=({fashion:'shirt',furniture:'chair',drinkware:'mug',notebook:'journal',photo:'frame',gift:'pouch',essential:'lamp',decor:'lamp',jewellery:'jewellery',packaging:'box',pen:'pen',tray:'tray',card:'card',accessory:'pouch'})[source.productType]||'box';
    const canonical=source.categoryIds.find(id=>taxonomy.some(c=>c.id===id&&c.departmentId===source.departmentIds[0]))||source.categoryIds[0];
    await createProduct(parseProductInput({title:source.title+' · demo catalogue',slug,sku:'DEMO-PRODUCT-'+source.id.toUpperCase(),description:source.description,categoryIds:source.categoryIds,collectionIds:['thoughtful'],occasionIds:source.occasionIds,recipientIds:source.recipientIds,price:variants[0]?.price||0,mrp:0,status:'live',images:[{url:'/demo-art/'+art+'.png',alt:'Illustrative demo artwork; not a merchant photo'}],variants,inventory:{quantity:0},personalization:{enabled:false},aarvika:{...blankAuthoring(),departmentIds:source.departmentIds,canonicalCategoryId:canonical,productType:source.productType,purchaseMode:source.purchaseMode,material:source.material,color:source.color,style:source.style,specs:source.specs,discovery:source.discovery||{},bundleEligible:source.bundleEligible,bundleUnits:source.bundleUnits,sizeGuide:source.sizeGuide,...(schema?{personalization:{fields:schema.fields,photoMaxBytes:schema.photoMaxBytes,photoMimeTypes:schema.photoMimeTypes}}:{})}}));added++;
  }
  if((await db.collection('homepage_sections').limit(1).get()).empty){
    const {publishHomepage}=require('../src/lib/admin/homepage-publication.ts');
    for(const section of [{id:'demo-home-hero',type:'hero',title:'Thoughtful gifts, made personal',subtitle:'Explore eight departments with clearly labelled demonstration designs.',imageUrl:'/demo-art/box.png',linkUrl:'/categories',buttonLabel:'Explore gifts',sortOrder:0},{id:'demo-home-categories',type:'categories',title:'Shop by department',sortOrder:1},{id:'demo-home-products',type:'collection',sourceId:'thoughtful',title:'Thoughtfully picked · demo',sortOrder:2,limit:8,linkUrl:'/search?collectionId=thoughtful'}])await publishHomepage({action:'publish',sectionId:section.id,section:{...section,subtitle:section.subtitle||'',imageUrl:section.imageUrl||'',linkUrl:section.linkUrl||'/categories',buttonLabel:section.buttonLabel||'',isActive:true,status:'published',scheduledAt:null},actorUid:'local-demo-seed'});
  }
  const inquiryRef=db.collection('furniture_inquiries').doc('demo-custom-console');
  if(!(await inquiryRef.get()).exists)await inquiryRef.set({version:2,demo:true,customerLabel:'Synthetic demo customer',kind:'Custom design',familyId:'furniture-9',dimensions:{width:120,depth:40,height:80,unit:'cm'},material:'Wood',finish:'Natural',notes:'Synthetic sample for internal review. No real customer, quote, delivery or installation commitment.',budgetPaise:2500000,pincode:'110001',assemblyRequested:true,status:'new',internalNote:'',revision:1,createdAt:new Date()});
  console.log(`Seeded ${taxonomy.length} approved categories; demo-aarvika-local only: synthetic owner/support users, ${added} new canonical demo products (existing demo edits retained), taxonomy and one legacy regression product. No cloud or payment processing.`);
}
seed().catch(error => { console.error(error.message); process.exitCode = 1; });
