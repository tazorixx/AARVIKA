/* One deployment: existing admin/API plus the same mobile UI exported for browsers. */
/* eslint-disable @typescript-eslint/no-require-imports -- Direct Node CommonJS build launcher. */
const fs = require('node:fs');
const path = require('node:path');
const {spawnSync} = require('node:child_process');
const admin = path.resolve(__dirname,'..'), mobile = path.resolve(admin,'../apps/mobile');
function run(command,args,cwd,env=process.env) {
  const result=spawnSync(command,args,{cwd,env,stdio:'inherit',shell:false,windowsHide:true});
  if(result.error)throw result.error;
  if(result.status!==0)process.exit(result.status??1);
}
if(process.env.AARVIKA_APPHOSTING!=='true') {
  run(process.execPath,[path.join(__dirname,'run-isolated.cjs'),'build'],admin);
} else {
  if(process.env.FIREBASE_PROJECT_ID!=='gift4u-4210f'||process.env.AARVIKA_SHARED!=='true')throw Error('The hosted build requires the real shared project.');
  const mobileEnv={...process.env,EXPO_NO_DOTENV:'1',EXPO_NO_TELEMETRY:'1',EXPO_PUBLIC_APP_ENV:'production',EXPO_PUBLIC_DATA_MODE:'shared-api',EXPO_PUBLIC_API_BASE_URL:'same-origin',EXPO_PUBLIC_CUSTOMER_AUTH_MODE:'shared'};
  // Public CDN endpoint enables existing admin-uploaded category and product photos.
  if(process.env.IMAGEKIT_URL_ENDPOINT)mobileEnv.EXPO_PUBLIC_IMAGEKIT_URL_ENDPOINT=process.env.IMAGEKIT_URL_ENDPOINT;
  for(const key of ['PROJECT_ID','API_KEY','AUTH_DOMAIN','APP_ID']) {
    const value=process.env['NEXT_PUBLIC_FIREBASE_'+key];
    if(!value)throw Error('Missing Firebase web configuration: '+key);
    mobileEnv['EXPO_PUBLIC_FIREBASE_'+key]=value;
  }
  // Export receives public settings only, never private Firebase or ImageKit credentials.
  for(const key of Object.keys(mobileEnv))if(/PRIVATE_KEY|ADMIN_PASSWORD|FIREBASE_CLIENT_EMAIL|GOOGLE_APPLICATION_CREDENTIALS/.test(key))delete mobileEnv[key];
  if(!fs.existsSync(path.join(mobile,'node_modules/expo/bin/cli'))) {
    const npmCli=process.env.npm_execpath;
    if(!npmCli)throw Error('Run this build using npm run build.');
    run(process.execPath,[npmCli,'ci','--workspaces=false','--no-audit','--no-fund'],mobile,mobileEnv);
  }
  run(process.execPath,[path.join(mobile,'node_modules/expo/bin/cli'),'export','--platform','web','--output-dir',path.join(admin,'public/storefront')],mobile,mobileEnv);
  if(!fs.existsSync(path.join(admin,'public/storefront/index.html')))throw Error('Mobile web export did not produce the storefront.');
  require('./storefront-recovery.cjs').installStorefrontRecovery(path.join(admin,'public/storefront/index.html'));
  run(process.execPath,[path.join(admin,'node_modules/next/dist/bin/next'),'build','--webpack'],admin);
}
