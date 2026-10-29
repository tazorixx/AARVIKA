/* eslint-disable @typescript-eslint/no-require-imports -- Isolated HTTP integration test. */
const assert=require('node:assert/strict');
const {isolatedEnv}=require('./isolated-env.cjs');isolatedEnv();
const base='http://127.0.0.1:3100';let checks=0;
(async()=>{
 const auth=await fetch('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=demo-aarvika-local-key',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'owner@aarvika.invalid',password:'Local-demo-only-2026!',returnSecureToken:true})});assert.equal(auth.status,200);const {idToken}=await auth.json();
 async function api(path,method='GET',body,status=200){const r=await fetch(base+path,{method,headers:{Authorization:'Bearer '+idToken,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});const data=await r.json();assert.equal(r.status,status,JSON.stringify(data));checks++;return data;}
 let state=await api('/api/admin/homepage/versions');const initialVersion=state.version;
 const made=await api('/api/admin/homepage','POST',{type:'hero',title:'Demo homepage first',linkUrl:'/categories',sortOrder:0},201);const id=made.section.id;
 await api('/api/admin/homepage/'+id,'PATCH',{action:'publish',expectedVersion:initialVersion});
 state=await api('/api/admin/homepage/versions');const first=state.version;
 await api('/api/admin/homepage/'+id,'PATCH',{title:'Demo homepage second'});
 await api('/api/admin/homepage/versions','POST',{action:'publish-layout',expectedVersion:first});
 state=await api('/api/admin/homepage/versions');assert.equal(state.version,first+1);
 let publicData=await (await fetch(base+'/api/homepage')).json();assert.equal(publicData.sections.find(s=>s.id===id).title,'Demo homepage second');
 await api('/api/admin/homepage/versions','POST',{action:'rollback',version:first,expectedVersion:first+1});
 publicData=await (await fetch(base+'/api/homepage')).json();assert.equal(publicData.sections.find(s=>s.id===id).title,'Demo homepage first');
 await api('/api/admin/homepage/versions','POST',{action:'rollback',version:first,expectedVersion:first},400);
 await api('/api/admin/homepage','POST',{type:'link',linkUrl:'https://invalid.example'},400);
 const bad=await api('/api/admin/homepage','POST',{type:'products',title:'Demo unsupported ranking',selection:'best-sellers',limit:8},201);
 await api('/api/admin/homepage/'+bad.section.id,'PATCH',{action:'publish'},400);
 await api('/api/admin/homepage/'+bad.section.id,'DELETE');
 const missing=await api('/api/admin/homepage','POST',{type:'products',title:'Demo invalid product',productIds:['missing-product'],limit:8},201);
 await api('/api/admin/homepage/'+missing.section.id,'PATCH',{action:'publish'},400);
 await api('/api/admin/homepage/'+missing.section.id,'DELETE');
 const category=await api('/api/admin/homepage','POST',{type:'categories',title:'Demo all departments',linkUrl:'/categories',limit:8,sortOrder:1},201);
 await api('/api/admin/homepage/'+category.section.id,'PATCH',{action:'publish'});
 await api('/api/admin/homepage/'+id,'PATCH',{action:'unpublish'});
 const merged=await api('/api/admin/homepage');assert.equal(merged.sections.find(s=>s.id===id).status,'draft');
 console.log(`${checks} homepage integration checks passed: legacy section workflow, new category section, draft/publish/layout history/rollback, stale version denial, unsupported rankings, missing products and external links rejected; isolated demo only.`);
})().catch(e=>{console.error(e.message);process.exitCode=1;});
