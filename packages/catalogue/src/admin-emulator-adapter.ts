import {CatalogueError,validateLocalBaseUrl,validateAdminEmulatorMeta,type CatalogueAdapter,type CatalogueSnapshot,type NetworkMode} from './api-contracts.ts';
import {validateSnapshot} from './validation.ts';
import {categoriesFrom,searchSnapshot,suggestionsFrom} from './reader.ts';
export function validateAdminEmulatorBaseUrl(input:string){const base=validateLocalBaseUrl(input);if(new URL(base).port!=='3100')throw new CatalogueError('UNSAFE_URL','Admin emulator uses only http://127.0.0.1:3100.');return base;}
export function createAdminEmulatorAdapter(baseUrl='http://127.0.0.1:3100',options:{fetcher?:typeof fetch;timeoutMs?:number}={}):CatalogueAdapter{
 const base=validateAdminEmulatorBaseUrl(baseUrl),timeout=options.timeoutMs??5000;
 if(!Number.isFinite(timeout)||timeout<1||timeout>30000)throw Error('Invalid request timeout.');
 let mode:NetworkMode='normal',pending:Promise<CatalogueSnapshot>|undefined;
 async function load():Promise<CatalogueSnapshot>{
  if(mode==='failure')throw new CatalogueError('DEMO_FAILURE','Demo connection unavailable. Restore Normal and retry.',true);
  if(mode==='slow')await new Promise(resolve=>setTimeout(resolve,1400));
  const controller=new AbortController();let timer:ReturnType<typeof setTimeout>|undefined;
  try{return await Promise.race([(async()=>{
   const response=await (options.fetcher??fetch)(base+'/api/mobile/v2/catalog',{method:'GET',redirect:'error',credentials:'omit',cache:'no-store',signal:controller.signal,headers:{Accept:'application/json'}});
   if(!response.ok)throw new CatalogueError('HTTP_'+response.status,'Demo admin catalogue unavailable. Check emulators and retry.',response.status>=500);
   if(!response.headers.get('content-type')?.includes('application/json'))throw new CatalogueError('INVALID_RESPONSE','Expected demo catalogue JSON.');
   const text=await response.text();if(text.length>8*1024*1024)throw new CatalogueError('INVALID_RESPONSE','Catalogue response too large.');
   const envelope=JSON.parse(text);validateAdminEmulatorMeta(envelope.meta);validateSnapshot(envelope.data,'admin-emulator');return envelope.data;
  })(),new Promise<never>((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(new CatalogueError('TIMEOUT','Demo admin catalogue timed out. Retry.',true));},timeout);})]);}
  catch(e){if(e instanceof CatalogueError)throw e;throw new CatalogueError('NETWORK_ERROR','Cannot reach the isolated admin catalogue. Retry.',true);}
  finally{if(timer)clearTimeout(timer);}
 }
 function bootstrap(){if(!pending)pending=load().finally(()=>{pending=undefined;});return pending;}
 // Every read uses a fresh canonical projection. Concurrent reads share one request.
 return {mode:'admin-emulator',setNetworkMode:value=>{mode=value;},bootstrap,departments:async()=>(await bootstrap()).departments,categories:async q=>categoriesFrom(await bootstrap(),q),layout:async()=>(await bootstrap()).layout,getProduct:async id=>(await bootstrap()).products.find(p=>p.id===id)??null,variants:async id=>(await bootstrap()).skus.filter(s=>s.productId===id),getSku:async id=>(await bootstrap()).skus.find(s=>s.id===id)??null,collections:async()=>(await bootstrap()).collections,search:async q=>searchSnapshot(await bootstrap(),q),suggestions:async text=>suggestionsFrom(await bootstrap(),text)};
}
