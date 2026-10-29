import {isCatalogueMedia} from './media-policy.ts';
import type {DepartmentId} from './departments.ts';
import type {Section} from './contracts.ts';
export const illustrationKinds=['box','mug','journal','frame','shirt','chair','pen','pouch','jewellery','lamp','tray','card'] as const;
export type IllustrationKind=typeof illustrationKinds[number];
export interface VisualMedia { title?:string;subtitle?:string;imagePath?:string;fallbackPath?:string;imageAlt?:string;imageFit?:'contain'|'cover';images?:{imagePath:string;imageAlt:string;imageFit?:'contain'|'cover'}[];illustration?:IllustrationKind;ctaLabel?:string }
export const departmentVisuals:Record<DepartmentId,VisualMedia>={
 wedding:{title:'For every beautiful beginning',subtitle:'Wedding gifts, little traditions & thoughtful details',illustration:'tray',ctaLabel:'Shop all Wedding Gifts'},
 birthday:{title:'A little joy, made just for them',subtitle:'Discover gifts by age, interest & who they are',illustration:'box',ctaLabel:'Shop Birthday Gifts'},
 personalized:{title:'Their name. Your thoughtfulness.',subtitle:'Names, photos & keepsakes with a personal touch',illustration:'mug',ctaLabel:'Explore Personalized Gifts'},
 anniversary:{title:'Another year, another memory',subtitle:'Meaningful keepsakes for every milestone',illustration:'frame',ctaLabel:'Shop Anniversary Gifts'},
 hampers:{title:'Good things, beautifully together',subtitle:'Thoughtful gift sets or a box of your own',illustration:'box',ctaLabel:'Build your own hamper'},
 clothing:{title:'Something that feels like you',subtitle:'Explore styles, fabrics & the right fit',illustration:'shirt',ctaLabel:'Shop Clothing'},
 stationery:{title:'Make room for bright ideas',subtitle:'For work, learning, creating & everyday notes',illustration:'journal',ctaLabel:'Shop Stationery'},
 furniture:{title:'Make space for your story',subtitle:'Home, work & custom concepts worth exploring',illustration:'chair',ctaLabel:'Explore Furniture'},
};
export function illustrationFor(name:string,departmentId:DepartmentId,index=0):IllustrationKind {
 const text=name.toLowerCase();
 const rules:[RegExp,IllustrationKind][]=[[/mug|drink|cup|coffee/,'mug'],[/photo|annivers|frame|keepsake/,'frame'],[/cloth|shirt|wear|women|men|fabric/,'shirt'],[/chair|sofa|room|furn|commercial/,'chair'],[/pen|writing|pencil/,'pen'],[/note|journal|planner|diar|office|school/,'journal'],[/jewel|bracelet/,'jewellery'],[/accessor|self.care|pouch/,'pouch'],[/decor|lamp|light/,'lamp'],[/wedding|haldi|ceremony|tradition|tray/,'tray'],[/card|art|craft/,'card']];
 return rules.find(([pattern])=>pattern.test(text))?.[1]??([departmentVisuals[departmentId].illustration!,'frame','box','pouch'] as IllustrationKind[])[index%4];
}
export function validPageKey(value:string){return value==='home'||(/^department:(wedding|birthday|personalized|anniversary|hampers|clothing|stationery|furniture)$/.test(value))||(/^(category|tradition|function|shortcut|collection):[a-zA-Z0-9_-]+(?::[a-zA-Z0-9_-]+)*$/.test(value)&&value.length<=160);}
export function defaultCommerceSections(id:DepartmentId):Section[]{
 const visual=departmentVisuals[id],base={enabled:true,responsivePresentation:'compact' as const,pageKey:'department:'+id};
 const section=(suffix:string,type:Section['type'],order:number,title:string,source:string,action:string):Section=>({...base,id:`commerce-${id}-${suffix}`,type,order,title,dataSourceRef:source,action});
 const additional:Section[]=[];
 const add=(source:string,title:string)=>additional.push(section(source,'departments',2.1+additional.length/10,title,'@'+source,`/search?departmentId=${id}`));
 if(id==='wedding'){add('functions','Shop by function');add('regions','Explore by region');add('recipients','Gifts for the people you love');}
 if(id==='birthday'){add('milestones','Every age, a new adventure');add('interests','Their favourite things');}
 if(id==='anniversary')add('recipients','Celebrate your favourite people');
 if(id==='clothing'){add('fabrics','Feel-good fabrics');add('sizes','Find your size');}
 if(id==='stationery')add('uses','For work, school & creative days');
 if(!['furniture','stationery','personalized'].includes(id))add('budget','Thoughtful at every budget');
 return [
  {...section('hero','hero',0,visual.title!,'',id==='hampers'?'/builder':`/search?departmentId=${id}`),subtitle:visual.subtitle,buttonLabel:visual.ctaLabel},
  section('shortcuts','departments',1,id==='wedding'?'Traditions, your way':id==='birthday'?'Who are you celebrating?':id==='anniversary'?'Milestones worth remembering':'Find your inspiration','@shortcuts',`/search?departmentId=${id}`),
  section('products','products',2,'Explore gifts','@department',`/search?departmentId=${id}`),
  ...additional,
  section('families','departments',3,id==='furniture'?'Spaces for home & work':'Shop by category','@families',`/search?departmentId=${id}`),
  section('collections','collection',4,'Curated together','@collections',`/search?departmentId=${id}`),
  section('editorial','combo',5,id==='furniture'?'Made for your space':id==='personalized'?'Your words. Their keepsake.':'A gift with your personal touch','@promo',id==='furniture'?'/furniture/inquiry':id==='personalized'?'/search?departmentId=personalized&personalizedOnly=true':'/builder'),
 ];
}
export function parseVisualMedia(value:unknown):VisualMedia {
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Visual metadata is required.');
 const v=value as Record<string,unknown>,result:VisualMedia={};
 for(const [key,max] of [['title',120],['subtitle',240],['imagePath',2000],['imageAlt',180],['ctaLabel',60]] as const){if(v[key]!==undefined){if(typeof v[key]!=='string'||v[key].length>max)throw Error('Invalid visual '+key);result[key]=v[key].trim();}}
 if(result.imagePath&&!isCatalogueMedia(result.imagePath))throw Error('Use a local asset or public ImageKit image.');
 if(result.imagePath&&!result.imageAlt)throw Error('Describe the image for accessibility.');
 if(v.fallbackPath!==undefined){if(typeof v.fallbackPath!=='string'||!/^\/category-art\/[a-zA-Z0-9_-]+\.svg$/.test(v.fallbackPath))throw Error('Invalid category fallback.');result.fallbackPath=v.fallbackPath;}
 if(v.imageFit!==undefined){if(!['contain','cover'].includes(String(v.imageFit)))throw Error('Invalid image fit.');result.imageFit=v.imageFit as VisualMedia['imageFit'];}
 if(v.images!==undefined){
  if(!Array.isArray(v.images)||v.images.length>5)throw Error('Use at most five hero images.');
  result.images=v.images.map((item:unknown)=>{
   if(!item||typeof item!=='object'||Array.isArray(item))throw Error('Invalid hero image.');
   const image=item as Record<string,unknown>;
   if(typeof image.imagePath!=='string'||!isCatalogueMedia(image.imagePath)||typeof image.imageAlt!=='string'||!image.imageAlt.trim()||image.imageAlt.length>180||image.imageFit!==undefined&&!['contain','cover'].includes(String(image.imageFit)))throw Error('Use a safe hero image and description.');
   return {imagePath:image.imagePath,imageAlt:image.imageAlt.trim(),...(image.imageFit?{imageFit:image.imageFit as 'contain'|'cover'}:{})};
  });
  if(new Set(result.images.map(image=>image.imagePath)).size!==result.images.length)throw Error('Hero images must be unique.');
 }
 if(v.illustration!==undefined){if(!illustrationKinds.includes(v.illustration as IllustrationKind))throw Error('Choose a demo illustration.');result.illustration=v.illustration as IllustrationKind;}
 return result;
}
