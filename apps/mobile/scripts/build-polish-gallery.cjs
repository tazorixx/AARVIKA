/* global __dirname */
const {chromium}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../evidence/polish');
const css='<style>body{font:14px system-ui;color:#3e155c;background:#faf8fc;margin:16px}h1{font-size:23px}h2{font-size:18px}a{color:#62298e}main{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}figure{margin:0;padding:8px;background:white;border:1px solid #e9ddf7}img{display:block;max-width:100%;max-height:620px;margin:auto}figcaption{margin:4px 0 10px}nav{display:flex;gap:12px;flex-wrap:wrap;margin:12px 0}.pair{display:grid;grid-template-columns:1fr 1fr;gap:10px}.pair img{max-height:650px}article{background:white;border:1px solid #e9ddf7;padding:12px;margin:16px 0}</style>';
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});const page=await browser.newPage({viewport:{width:1200,height:1000}});
 for(const stage of ['before','after']){const dir=path.join(root,stage);if(!fs.existsSync(dir))continue;const shots=fs.readdirSync(dir).filter(f=>f.endsWith('-390.png')).sort();
  for(let i=0;i<shots.length;i+=9){const items=shots.slice(i,i+9).map(f=>`<figure><figcaption>${f.replace('-390.png','')} · ${stage}</figcaption><img src="data:image/png;base64,${fs.readFileSync(path.join(dir,f)).toString('base64')}"></figure>`).join('');await page.setContent(`${css}<h1>AARVIKA · ${stage} · screen review ${i/9+1}</h1><main>${items}</main>`);await page.evaluate(()=>Promise.all([...document.images].map(i=>i.decode())));await page.screenshot({path:path.join(root,`${stage}-contact-${i/9+1}.png`),fullPage:true});}
 }
 await browser.close();
 const before=fs.readdirSync(path.join(root,'before')).filter(f=>f.endsWith('-390.png')).sort();
 const names=[...new Set(before.map(f=>f.replace('-390.png','')).concat(fs.existsSync(path.join(root,'after'))?fs.readdirSync(path.join(root,'after')).filter(f=>f.endsWith('-390.png')).map(f=>f.replace('-390.png','')):[]))];
 const content=names.map(name=>`<article id="${name}"><h2>${name}</h2><div class="pair">${['before','after'].map(stage=>fs.existsSync(path.join(root,stage,`${name}-390.png`))?`<figure><figcaption>${stage} · 390px</figcaption><a href="${stage}/${name}-390.png"><img loading="lazy" src="${stage}/${name}-390.png"></a></figure>`:`<p>${stage==='before'?'New local demo screen':'After capture pending'}</p>`).join('')}</div><nav>${[320,390,430,834,1194].map(w=>['before','after'].filter(s=>fs.existsSync(path.join(root,s,`${name}-${w}.png`))).map(s=>`<a href="${s}/${name}-${w}.png">${s} ${w}px</a>`).join(' · ')).join(' ')}</nav></article>`).join('');
 fs.writeFileSync(path.join(root,'index.html'),`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>AARVIKA mobile polish</title>${css}<h1>AARVIKA · actual before / after</h1><p>Local demo app, real Expo web captures. No native device or merchant photography claim.</p><nav>${names.map(n=>`<a href="#${n}">${n}</a>`).join(' ')}</nav>${content}</html>`);
})();
