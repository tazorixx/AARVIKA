import {CatalogueError,validateSharedCatalogueMeta,type CatalogueAdapter,type CatalogueSnapshot,type NetworkMode} from './api-contracts.ts';
import {validateSnapshot} from './validation.ts';
import {categoriesFrom,searchSnapshot,suggestionsFrom} from './reader.ts';

export function validateSharedApiBaseUrl(input:string,environment:'development'|'test'|'staging'|'production') {
 const url=new URL(input);
 const local=environment==='development'||environment==='test';
 const loopback=local&&url.protocol==='http:'&&url.hostname==='127.0.0.1'&&url.port==='3100';
 const secure=url.protocol==='https:'&&!url.port;
 if(!(loopback||secure)||url.username||url.password||url.search||url.hash||url.pathname!=='/')throw new CatalogueError('UNSAFE_URL','Use the HTTPS published-catalogue API, or the local shared admin at 127.0.0.1:3100 in development.');
 return url.origin;
}

export function createSharedApiAdapter(baseUrl:string,environment:'development'|'test'|'staging'|'production',options:{fetcher?:typeof fetch;timeoutMs?:number}={}):CatalogueAdapter {
 const base=validateSharedApiBaseUrl(baseUrl,environment),timeout=options.timeoutMs??8000;
 if(!Number.isFinite(timeout)||timeout<1||timeout>30000)throw Error('Invalid request timeout.');
 let mode:NetworkMode='normal',pending:Promise<CatalogueSnapshot>|undefined;
 async function load():Promise<CatalogueSnapshot>{
  if(mode==='failure')throw new CatalogueError('NETWORK_ERROR','Catalogue connection unavailable. Retry.',true);
  if(mode==='slow')await new Promise(resolve=>setTimeout(resolve,1400));
  const controller=new AbortController();let timer:ReturnType<typeof setTimeout>|undefined;
  try{return await Promise.race([(async()=>{
   const response=await (options.fetcher??fetch)(base+'/api/mobile/v2/catalog',{method:'GET',redirect:'error',credentials:'omit',cache:'no-store',signal:controller.signal,headers:{Accept:'application/json'}});
   if(!response.ok)throw new CatalogueError('HTTP_'+response.status,'Published catalogue unavailable. Retry.',response.status>=500);
   if(!response.headers.get('content-type')?.includes('application/json'))throw new CatalogueError('INVALID_RESPONSE','Expected catalogue JSON.');
   const text=await response.text();if(text.length>8*1024*1024)throw new CatalogueError('INVALID_RESPONSE','Catalogue response too large.');
   const envelope=JSON.parse(text);validateSharedCatalogueMeta(envelope.meta);validateSnapshot(envelope.data,'shared-api');return envelope.data;
  })(),new Promise<never>((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(new CatalogueError('TIMEOUT','Published catalogue timed out. Retry.',true));},timeout);})]);}
  catch(error){if(error instanceof CatalogueError)throw error;throw new CatalogueError('NETWORK_ERROR','Cannot reach the published catalogue. Retry.',true);}
  finally{if(timer)clearTimeout(timer);}
 }
 function bootstrap(){if(!pending)pending=load().finally(()=>{pending=undefined;});return pending;}
 return {mode:'shared-api',setNetworkMode:value=>{mode=value;},bootstrap,departments:async()=>(await bootstrap()).departments,categories:async q=>categoriesFrom(await bootstrap(),q),layout:async()=>(await bootstrap()).layout,getProduct:async id=>(await bootstrap()).products.find(p=>p.id===id)??null,variants:async id=>(await bootstrap()).skus.filter(s=>s.productId===id),getSku:async id=>(await bootstrap()).skus.find(s=>s.id===id)??null,collections:async()=>(await bootstrap()).collections,search:async q=>searchSnapshot(await bootstrap(),q),suggestions:async text=>suggestionsFrom(await bootstrap(),text)};
}
