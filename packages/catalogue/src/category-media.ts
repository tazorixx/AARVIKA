import assignments from './fixtures/category-media.json' with {type:'json'};
import index from './fixtures/category-art-index.json' with {type:'json'};
import {categoryArtworkSvg} from './category-artwork.ts';
import type {VisualMedia} from './visual-commerce.ts';
const records=new Map(index.map(c=>[c.id,c]));
const cache=new Map<string,string>();
export function localCategoryVisual(id:string):VisualMedia|undefined{return (assignments as Record<string,VisualMedia>)[id];}
/** Resolve only approved local IDs, never arbitrary SVG markup from a server. */
export function categoryArtworkData(path:string|undefined):string|undefined{
 const match=path?.match(/^\/category-art\/([a-zA-Z0-9_-]+)\.svg$/);if(!match)return;
 let id=match[1],hero:false|'desktop'|'mobile'=false;
 if(id.endsWith('-desktop')){id=id.slice(0,-8);hero='desktop';}else if(id.endsWith('-mobile')){id=id.slice(0,-7);hero='mobile';}
 const category=records.get(id);if(!category)return;
 if(cache.has(path!))return cache.get(path!);
 const result='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(categoryArtworkSvg(category,records.get(category.parentId||'')?.name,hero));
 if(cache.size>=64)cache.delete(cache.keys().next().value!);cache.set(path!,result);return result;
}
