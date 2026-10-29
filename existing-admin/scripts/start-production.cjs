/* eslint-disable @typescript-eslint/no-require-imports -- Direct Node CommonJS runtime launcher. */
const path=require('node:path');
const {spawn}=require('node:child_process');
const hosted=process.env.AARVIKA_APPHOSTING==='true';
const command=hosted?[require.resolve('next/dist/bin/next'),'start','--hostname','0.0.0.0','--port',process.env.PORT||'8080']:[path.join(__dirname,'run-isolated.cjs'),'start'];
const child=spawn(process.execPath,command,{stdio:'inherit',windowsHide:true,env:process.env});
child.on('error',error=>{console.error(error.message);process.exitCode=1;});
child.on('exit',code=>{process.exitCode=code??1;});
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>child.kill(signal));
