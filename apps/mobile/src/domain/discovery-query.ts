import type {SearchQuery} from './contracts.ts';
const departments=['wedding','birthday','personalized','anniversary','hampers','clothing','stationery','furniture'];
export function discoveryQuery(params:Record<string,string|string[]|undefined>):SearchQuery {
 const value=(key:string)=>typeof params[key]==='string'?(params[key] as string).slice(0,160):undefined;
 const query:SearchQuery={};
 const text=value('text');if(text)query.text=text;
 for(const key of ['collectionId','categoryId','recipient','interest','material','occasion','productType','color'] as const){const text=value(key);if(text)query[key]=text;}
 const department=value('departmentId');if(department&&departments.includes(department))query.departmentId=department as SearchQuery['departmentId'];
 for(const key of ['age','year','maxPrice'] as const){const n=value(key);if(n!==undefined&&Number.isSafeInteger(Number(n))&&Number(n)>=0)query[key]=Number(n);}
 if(value('personalizedOnly')==='true')query.personalizedOnly=true;
 if(value('bundleOnly')==='true')query.bundleOnly=true;
 const attributeKey=value('attributeKey'),attributeValue=value('attributeValue');if(attributeKey&&attributeValue)query.attributes={[attributeKey]:attributeValue};
 return query;
}
