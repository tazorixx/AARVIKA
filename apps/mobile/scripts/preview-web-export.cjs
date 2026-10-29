/* Local static QA preview only. No catalogue API, writes or external services. */
/* global __dirname */
const http=require('node:http'),fs=require('node:fs/promises'),path=require('node:path');
const root=path.resolve(__dirname,'../dist');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css','.json':'application/json','.png':'image/png','.svg':'image/svg+xml','.ico':'image/x-icon','.ttf':'font/ttf','.woff2':'font/woff2','.webp':'image/webp'};
http.createServer(async(req,res)=>{
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);return res.end();}
  try{
    const requested=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
    let file=path.resolve(root,`.${requested}`);const relative=path.relative(root,file);
    if(relative.startsWith('..')||path.isAbsolute(relative)){res.writeHead(403);return res.end();}
    try{if((await fs.stat(file)).isDirectory())file=path.join(file,'index.html');}
    catch{if(path.extname(requested)){res.writeHead(404);return res.end();}file=path.join(root,'index.html');}
    const body=await fs.readFile(file);
    res.writeHead(200,{'Content-Type':mime[path.extname(file)]??'application/octet-stream','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});
    res.end(req.method==='HEAD'?undefined:body);
  }catch{res.writeHead(404);res.end('Export not found. Run the web export first.');}
}).listen(8083,'127.0.0.1',()=>console.log('AARVIKA fixture web export: http://127.0.0.1:8083 · read-only local preview'));
