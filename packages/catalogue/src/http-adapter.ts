import type { CatalogueAdapter, CatalogueSnapshot, NetworkMode } from './api-contracts.ts';
import { CatalogueError, validateLocalBaseUrl, validateMeta } from './api-contracts.ts';
import { validateSnapshot } from './validation.ts';
import { validateSearch } from './reader.ts';

export function createLocalApiAdapter(baseUrl: string, options: { timeoutMs?: number; fetcher?: typeof fetch } = {}): CatalogueAdapter {
  const base = validateLocalBaseUrl(baseUrl), timeoutMs=options.timeoutMs??5000;
  if (!Number.isFinite(timeoutMs)||timeoutMs<1||timeoutMs>30000) throw new Error('Invalid request timeout.');
  let mode: NetworkMode='normal';
  async function request<T>(path:string, validate:(value:unknown)=>void):Promise<T> {
    if(mode==='slow') await new Promise(r=>setTimeout(r,1400));
    if(mode==='failure') throw new CatalogueError('DEMO_FAILURE','Demo network failure. Change network mode or retry.',true);
    const controller=new AbortController(); let timer:ReturnType<typeof setTimeout>|undefined;
    try {
      const result = await Promise.race([
        (async()=>{
          const response=await (options.fetcher??fetch)(`${base}${path}`,{method:'GET',signal:controller.signal,redirect:'error',credentials:'omit',headers:{Accept:'application/json'}});
          if(!response.ok) throw new CatalogueError(`HTTP_${response.status}`,response.status>=500?'Local catalogue unavailable. Try again.':'Local catalogue request rejected.',response.status>=500||response.status===429);
          if(!response.headers.get('content-type')?.includes('application/json')) throw new CatalogueError('INVALID_RESPONSE','Local API returned a non-JSON response.');
          const text=await response.text(); if(text.length>8*1024*1024) throw new CatalogueError('INVALID_RESPONSE','Local API response exceeds the catalogue limit.');
          const body=JSON.parse(text); validateMeta(body.meta); validate(body.data); return body.data as T;
        })(),
        new Promise<never>((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(new CatalogueError('TIMEOUT','Local catalogue timed out. Check the local API and retry.',true));},timeoutMs);})
      ]); return result;
    } catch(e) { if(e instanceof CatalogueError) throw e; if(e instanceof SyntaxError) throw new CatalogueError('INVALID_RESPONSE','Local API returned invalid JSON.'); throw new CatalogueError('NETWORK_ERROR','Could not reach the local catalogue. Check the API and retry.',true); }
    finally { if(timer) clearTimeout(timer); }
  }
  const array=(v:unknown)=>{if(!Array.isArray(v))throw new CatalogueError('INVALID_RESPONSE','Expected a catalogue list.');};
  // Validate resource responses against a complete canonical snapshot before use.
  let canonical:CatalogueSnapshot|undefined;
  async function bootstrap(){const data=await request<CatalogueSnapshot>('/v1/catalog/bootstrap',validateSnapshot);canonical=data;return data;}
  async function resource<T>(path:string, validate:(v:unknown)=>void){ if(!canonical) await bootstrap();return request<T>(path,validate); }
  function records(key:'products'|'skus'|'categories'|'departments'|'collections',value:unknown){
    array(value);const items=value as {id:string}[];
    if(!canonical||items.some(i=>!i||typeof i.id!=='string'||!canonical?.[key].some(p=>p.id===i.id))||new Set(items.map(i=>i.id)).size!==items.length)throw new CatalogueError('INVALID_RESPONSE','Unknown or duplicate catalogue record.');
    validateSnapshot({...canonical,[key]:canonical[key].map(p=>items.find(i=>i.id===p.id)??p)});
  }
  const product=(v:unknown)=>{if(v!==null)records('products',[v]);};
  return {
    mode:'local-api',setNetworkMode:m=>{mode=m;},bootstrap,
    departments:()=>resource('/v1/catalog/departments',v=>records('departments',v)),
    categories:q=>resource(`/v1/catalog/categories?${new URLSearchParams(Object.entries(q??{}).filter(([,v])=>v!==undefined).map(([k,v])=>[k,v===null?'null':String(v)]))}`,v=>records('categories',v)),
    layout:()=>resource('/v1/catalog/layout',v=>validateSnapshot({...canonical,layout:v})),
    getProduct:id=>resource(`/v1/catalog/products/${encodeURIComponent(id)}`,product),
    variants:id=>resource(`/v1/catalog/products/${encodeURIComponent(id)}/skus`,v=>{records('skus',v);if((v as {productId:string}[]).some(s=>s.productId!==id))throw new CatalogueError('INVALID_RESPONSE','Variant belongs to a different product.');}),
    getSku:id=>resource(`/v1/catalog/skus/${encodeURIComponent(id)}`,v=>{if(v!==null)records('skus',[v]);}),
    collections:()=>resource('/v1/catalog/collections',v=>records('collections',v)),
    search:q=>{validateSearch(q);return resource(`/v1/catalog/search?q=${encodeURIComponent(JSON.stringify(q))}`,v=>{const r=v as {products:unknown[];total:number;nextCursor?:string};if(!r||!Array.isArray(r.products)||!Number.isSafeInteger(r.total)||r.total<r.products.length||r.nextCursor!==undefined&&!/^\d{1,9}$/.test(r.nextCursor))throw new CatalogueError('INVALID_RESPONSE','Invalid search response.');records('products',r.products);});},
    suggestions:q=>resource(`/v1/catalog/suggestions?text=${encodeURIComponent(q)}`,v=>{array(v);if(!(v as unknown[]).every(s=>typeof s==='string'))throw new CatalogueError('INVALID_RESPONSE','Invalid suggestions.');})
  };
}
// Explicit extension point; enabling a cloud source requires its own approval/verification gate.
export function createStagingAdapter(): never { throw new CatalogueError('STAGING_DISABLED','Staging services are disabled in Task 10A.'); }
