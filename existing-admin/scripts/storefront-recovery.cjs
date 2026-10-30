/* eslint-disable @typescript-eslint/no-require-imports -- Node build helper. */
const fs = require('node:fs');
const path = require('node:path');
function installStorefrontRecovery(file) {
  const html=fs.readFileSync(file,'utf8');
  if(html.includes('id="aarvika-startup"'))return;
  if(!html.includes('<body>'))throw Error('Storefront export has no body.');
  const script=fs.readFileSync(path.join(__dirname,'storefront-bootstrap.js'),'utf8');
  const recovery=`<div id="aarvika-startup" role="status" style="position:fixed;inset:0;z-index:99999;background:#fff;color:#4A1D7A;text-align:center;padding:25vh 24px 24px;font-family:system-ui,sans-serif"><strong style="font-size:22px">AARVIKA</strong><p id="aarvika-startup-message">Opening your gift collections…</p><a id="aarvika-startup-retry" hidden href="?reload=1" style="color:#4A1D7A">Reload app</a></div><script>${script}</script>`;
  fs.writeFileSync(file,html.replace('<body>','<body>'+recovery));
}
module.exports={installStorefrontRecovery};
