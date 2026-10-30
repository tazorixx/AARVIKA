const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {installStorefrontRecovery}=require('../scripts/storefront-recovery.cjs');
const code=fs.readFileSync(path.join(__dirname,'../scripts/storefront-bootstrap.js'),'utf8');
function page(href='https://store.example/categories?occasion=wedding#cards',storage=new Map()) {
  const nodes={'aarvika-startup':{hidden:false},'aarvika-startup-message':{},'aarvika-startup-retry':{hidden:true},root:{childElementCount:0}};
  const events={},redirects=[];let observer,timeout,cleared=false;
  const window={location:{href,origin:new URL(href).origin,replace:url=>redirects.push(url)},addEventListener:(name,handler)=>events[name]=handler};
  const context={window,document:{getElementById:id=>nodes[id],documentElement:{}},URL,Date,sessionStorage:{getItem:key=>storage.get(key),setItem:(key,value)=>storage.set(key,value)},setTimeout:fn=>{timeout=fn;return 1;},clearTimeout:()=>{cleared=true;},MutationObserver:class{constructor(fn){observer=fn;}observe(){}disconnect(){}}};
  vm.runInNewContext(code,context);
  return {nodes,events,redirects,storage,mount(){nodes.root.childElementCount=1;observer();},timeout:()=>timeout(),cleared:()=>cleared};
}
const missing={target:{tagName:'SCRIPT',src:'https://store.example/_expo/static/js/web/old.js'}};
test('missing release bundle reloads once and preserves the current route',()=>{
  const p=page();p.events.error(missing);p.events.error(missing);assert.equal(p.redirects.length,1);
  const next=new URL(p.redirects[0]);assert.equal(next.pathname,'/categories');assert.equal(next.searchParams.get('occasion'),'wedding');assert.equal(next.hash,'#cards');assert.ok(next.searchParams.get('_aarvika_retry'));
});
test('repeated bundle failure gives a visible retry instead of looping',()=>{
  const p=page();p.events.error(missing);const next=page(p.redirects[0],p.storage);next.events.error(missing);
  assert.equal(next.redirects.length,0);assert.equal(next.nodes['aarvika-startup-retry'].hidden,false);assert.match(next.nodes['aarvika-startup-message'].textContent,/connection/);
});
test('image and unrelated errors do not reload the app',()=>{
  const p=page();p.events.error({target:{tagName:'IMG',src:missing.target.src}});p.events.error({target:{tagName:'SCRIPT',src:'https://other.example/_expo/a.js'}});p.events.unhandledrejection({reason:Error('Payment validation failed')});assert.equal(p.redirects.length,0);
});
test('lazy bundle rejection recovers even after initial app render',()=>{
  const p=page();p.mount();p.events.unhandledrejection({reason:Error('Failed to fetch dynamically imported module')});assert.equal(p.redirects.length,1);
});
test('successful mount hides the startup notice and cancels its timer',()=>{
  const p=page();p.mount();assert.equal(p.nodes['aarvika-startup'].hidden,true);assert.equal(p.cleared(),true);
});
test('slow or failed startup leaves a visible manual retry',()=>{
  const p=page();p.timeout();assert.equal(p.nodes['aarvika-startup-retry'].hidden,false);assert.equal(p.redirects.length,0);
});
test('recovery is embedded before Expo scripts and installation is idempotent',()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'aarvika-startup-')),file=path.join(dir,'index.html');
  try {fs.writeFileSync(file,'<body><div id="root"></div><script src="/_expo/entry.js"></script></body>');installStorefrontRecovery(file);const first=fs.readFileSync(file,'utf8');assert.ok(first.indexOf('window.addEventListener')<first.indexOf('src="/_expo/'));installStorefrontRecovery(file);assert.equal(fs.readFileSync(file,'utf8'),first);}finally{fs.unlinkSync(file);fs.rmdirSync(dir);}
});
test('launch cache headers change for equal-size releases and do not affect admin/API routes',async()=>{
  const ts=require('typescript');
  const source=fs.readFileSync(path.join(__dirname,'../next.config.ts'),'utf8');
  const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  async function headers(html){const exports={};vm.runInNewContext(compiled,{exports,__dirname:path.join(__dirname,'..'),process:{env:{AARVIKA_APPHOSTING:'true'}},require:name=>name==='node:fs'?{readFileSync:()=>html}:require(name)});return exports.default.headers();}
  const first=await headers('<script src="one.js"></script>'),second=await headers('<script src="two.js"></script>');
  const root=first.find(r=>r.source==='/'),other=second.find(r=>r.source==='/');
  assert.equal(root.headers.find(h=>h.key==='Cache-Control').value,'no-store, max-age=0');
  assert.notEqual(root.headers.find(h=>h.key==='ETag').value,other.headers.find(h=>h.key==='ETag').value);
  assert.ok(!first.some(r=>r.source.startsWith('/admin')||r.source.startsWith('/api')));
});
