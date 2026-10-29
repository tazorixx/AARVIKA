import { createServer, type Server } from 'node:http';
import { demoSnapshot } from '../../../packages/catalogue/src/fixture-adapter.ts';
import { CatalogueError, localMeta, type CatalogueSnapshot } from '../../../packages/catalogue/src/api-contracts.ts';
import { categoriesFrom, searchSnapshot, suggestionsFrom, validateSearch } from '../../../packages/catalogue/src/reader.ts';
import { validateSnapshot } from '../../../packages/catalogue/src/validation.ts';

export function assertIsolatedEnvironment(env:NodeJS.ProcessEnv) {
  const forbidden=Object.keys(env).filter(k=> /^(GOOGLE_APPLICATION_CREDENTIALS|GOOGLE_CLOUD_PROJECT|GCLOUD_PROJECT|FIREBASE_CONFIG|FIREBASE_PROJECT_ID|FIREBASE_TOKEN|FIRESTORE_EMULATOR_HOST|FIREBASE_AUTH_EMULATOR_HOST|FIREBASE_STORAGE_EMULATOR_HOST|RAZORPAY_.*)$/.test(k)&&env[k]);
  if(forbidden.length) throw new Error('Local API refuses Firebase, cloud credential, emulator or payment configuration. Start it in a clean local shell.');
  if(env.LOCAL_API_HOST && env.LOCAL_API_HOST!=='127.0.0.1')throw new Error('Local API binds only to 127.0.0.1.');
}
export function createLocalServer(data:CatalogueSnapshot=demoSnapshot()):Server {
  validateSnapshot(data);
  const snapshot=JSON.parse(JSON.stringify(data)) as CatalogueSnapshot;
  return createServer((req,res)=>{
    res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
    const send=(status:number,body:unknown)=>{res.writeHead(status);res.end(JSON.stringify(body));};
    const fail=(status:number,code:string,message:string,retryable=false)=>send(status,{error:{code,message,retryable}});
    const host=req.headers.host??'';
    if(!/^127\.0\.0\.1:\d+$/.test(host)&&!/^localhost:\d+$/.test(host))return fail(403,'INVALID_HOST','Loopback Host required.');
    const origin=req.headers.origin;
    if(origin){let allowed=false;try {const u=new URL(origin);allowed=['127.0.0.1','localhost'].includes(u.hostname)&&u.protocol==='http:'&&!u.username&&!u.password&&!!u.port;}catch{}if(!allowed)return fail(403,'INVALID_ORIGIN','Only local development origins are allowed.');res.setHeader('Access-Control-Allow-Origin',origin);res.setHeader('Vary','Origin');}
    if(req.method==='OPTIONS'){res.setHeader('Access-Control-Allow-Methods','GET, OPTIONS');res.setHeader('Access-Control-Allow-Headers','Accept');res.writeHead(204);res.end();return;}
    if(req.method!=='GET')return fail(405,'READ_ONLY','This local demo catalogue API is read-only.');
    if(!req.url||req.url.length>8192)return fail(414,'QUERY_TOO_LARGE','Request URL too large.');
    try {
      const u=new URL(req.url,'http://127.0.0.1');const path=u.pathname;let result:unknown;
      if(path==='/health'||path==='/v1/meta')result=localMeta;
      else if(path==='/v1/catalog/bootstrap')result=snapshot;
      else if(path==='/v1/catalog/departments')result=snapshot.departments;
      else if(path==='/v1/catalog/categories'){
        const departmentId=u.searchParams.get('departmentId')??undefined,parent=u.searchParams.get('parentId'),level=u.searchParams.get('level');
        if(departmentId&&!snapshot.departments.some(d=>d.id===departmentId)||level!==null&&!['1','2','3'].includes(level)||[...u.searchParams.keys()].some(k=>!['departmentId','parentId','level'].includes(k)))throw new CatalogueError('INVALID_QUERY','Invalid category query.');
        result=categoriesFrom(snapshot,{departmentId,parentId:parent==='null'?null:parent??undefined,level:level?Number(level):undefined});
      }
      else if(path==='/v1/catalog/layout')result=snapshot.layout;
      else if(path==='/v1/catalog/collections')result=snapshot.collections;
      else if(path==='/v1/catalog/search'||path==='/v1/catalog/products'){if([...u.searchParams.keys()].some(k=>k!=='q'))throw new CatalogueError('INVALID_QUERY','Use the q JSON search parameter.');result=searchSnapshot(snapshot,validateSearch(JSON.parse(u.searchParams.get('q')??'{}')));}
      else if(path==='/v1/catalog/suggestions'){const text=u.searchParams.get('text')??'';if(text.length>200)throw new CatalogueError('INVALID_QUERY','Search text too long.');result=suggestionsFrom(snapshot,text);}
      else {
        const variants=path.match(/^\/v1\/catalog\/products\/([^/]+)\/skus$/),product=path.match(/^\/v1\/catalog\/products\/([^/]+)$/),sku=path.match(/^\/v1\/catalog\/skus\/([^/]+)$/);
        if(variants)result=snapshot.skus.filter(s=>s.productId===decodeURIComponent(variants[1]));
        else if(product)result=snapshot.products.find(p=>p.id===decodeURIComponent(product[1]))??null;
        else if(sku)result=snapshot.skus.find(s=>s.id===decodeURIComponent(sku[1]))??null;
        else return fail(404,'NOT_FOUND','Local catalogue route not found.');
      }
      send(200,{meta:localMeta,data:result});
    }catch(e){if(e instanceof CatalogueError||e instanceof SyntaxError||e instanceof URIError)fail(400,'INVALID_QUERY','Invalid catalogue query.');else fail(500,'INTERNAL_ERROR','Local catalogue unavailable.',true);}
  });
}
export async function startLocalServer(port=3001,env:NodeJS.ProcessEnv=process.env){
  assertIsolatedEnvironment(env);if(!Number.isInteger(port)||port<0||port>65535)throw new Error('Invalid local API port.');
  const server=createLocalServer();server.requestTimeout=10000;server.headersTimeout=5000;
  await new Promise<void>((resolve,reject)=>{server.once('error',reject);server.listen(port,'127.0.0.1',()=>{server.off('error',reject);resolve();});});return server;
}
