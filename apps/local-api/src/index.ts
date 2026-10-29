import { startLocalServer } from './server.ts';
const server=await startLocalServer(Number(process.env.LOCAL_API_PORT??3001));
const address=server.address();
console.log(`AARVIKA demo catalogue: http://127.0.0.1:${typeof address==='object'?address?.port:3001} · read-only · Firebase/payments disabled`);
for(const signal of ['SIGINT','SIGTERM'] as const)process.on(signal,()=>server.close(()=>process.exit(0)));
