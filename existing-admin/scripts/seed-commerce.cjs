/* eslint-disable @typescript-eslint/no-require-imports -- Guarded local fixture composition only. */
const {isolatedEnv}=require('./isolated-env.cjs');Object.assign(process.env,isolatedEnv());
const {getAdminDb}=require('../src/lib/firebase-admin.ts');
const {departments}=require('../../packages/catalogue/src/departments.ts');
const {defaultCommerceSections}=require('../../packages/catalogue/src/visual-commerce.ts');
const {publishHomepage}=require('../src/lib/admin/homepage-publication.ts');
(async()=>{const db=getAdminDb(),current=await db.collection('homepage_sections').get(),drafts=await db.collection('homepage_drafts').get(),known=new Set([...current.docs,...drafts.docs].map(d=>d.id)),ids=[],batch=db.batch();
 for(const d of departments)for(const s of defaultCommerceSections(d.id)){if(known.has(s.id))continue;ids.push(s.id);batch.set(db.collection('homepage_drafts').doc(s.id),{type:s.type==='departments'?'categories':s.type==='combo'?'banner':s.type,title:s.title,subtitle:s.subtitle||'',pageKey:s.pageKey,imageUrl:s.imagePath||'',imageAlt:s.imageAlt||s.title,imageFit:'contain',linkUrl:s.action,buttonLabel:s.buttonLabel||'',sortOrder:s.order,isActive:true,status:'draft',sourceId:s.dataSourceRef,productIds:[],selection:'manual',limit:8});}
 if(ids.length){await batch.commit();await publishHomepage({action:'publish-layout',draftIds:ids,actorUid:'demo-commerce-seed'});}
 console.log(`demo-aarvika-local only: ${ids.length} missing visual sections published; existing sections/drafts preserved. No product, stock or cloud changes.`);
})().catch(e=>{console.error(e.message);process.exitCode=1;});
