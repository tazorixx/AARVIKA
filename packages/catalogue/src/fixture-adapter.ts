import {withOwnerHero} from './hero-images.ts';
import {departmentVisuals,illustrationFor,defaultCommerceSections} from './visual-commerce.ts';
import {localCategoryVisual} from './category-media.ts';
import { products, skus, categories, schemas, bundleTemplates, pageLayout } from './demo.ts';
import { departments } from './departments.ts';
import { traditions, ceremonies, ceremonyNeeds, weddingLanes, weddingKit } from './wedding.ts';
import { clothingColumns } from './fixtures/clothing-stationery-fixtures.ts';
import { localMeta, type CatalogueAdapter, type CatalogueSnapshot, type NetworkMode } from './api-contracts.ts';
import { categoriesFrom, searchSnapshot, suggestionsFrom } from './reader.ts';

export function demoSnapshot(): CatalogueSnapshot {
  return JSON.parse(JSON.stringify({ meta: localMeta, commercePages:departments.map(d=>({key:'department:'+d.id,sections:defaultCommerceSections(d.id).map(section=>withOwnerHero(section,d.id))})), departments, categories:categories.map((c,i)=>({...c,visual:{...(c.level===1?departmentVisuals[c.departmentId]:{title:c.name}),illustration:illustrationFor(c.name,c.departmentId,i),...localCategoryVisual(c.id)}})), products, skus, schemas, bundleTemplates: [...bundleTemplates, weddingKit], layout: {...pageLayout,sections:pageLayout.sections.map(section=>withOwnerHero(section,'home'))}, clothingColumns,
    collections: [...new Set(products.flatMap(p=>p.collectionIds))].map(id=>({ id, title: id === 'thoughtful' ? 'Thoughtfully picked · demo' : `${id} · demo`, productIds: products.filter(p=>p.collectionIds.includes(id)).map(p=>p.id) })),
    wedding: { traditions, ceremonies, ceremonyNeeds, weddingLanes } }));
}
export function createFixtureAdapter(): CatalogueAdapter {
  const data = demoSnapshot(); let mode: NetworkMode = 'normal';
  async function transport<T>(get: () => T): Promise<T> { await new Promise(r=>setTimeout(r,mode === 'slow' ? 1400 : 80)); if(mode === 'failure') throw new Error('Demo network failure. Change network mode or retry.'); return JSON.parse(JSON.stringify(get())); }
  return { mode: 'fixture', setNetworkMode: m=>{mode=m;}, bootstrap: ()=>transport(()=>data), departments: ()=>transport(()=>data.departments), categories:q=>transport(()=>categoriesFrom(data,q)), layout:()=>transport(()=>data.layout), getProduct:id=>transport(()=>data.products.find(p=>p.id===id)??null), variants:id=>transport(()=>data.skus.filter(s=>s.productId===id)), getSku:id=>transport(()=>data.skus.find(s=>s.id===id)??null), collections:()=>transport(()=>data.collections), search:q=>transport(()=>searchSnapshot(data,q)), suggestions:q=>transport(()=>suggestionsFrom(data,q)) };
}
