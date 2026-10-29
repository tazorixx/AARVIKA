import {startLocalAuthServer} from './server.ts';
const server = await startLocalAuthServer(Number(process.env.LOCAL_AUTH_PORT ?? 3002));
console.log('AARVIKA local email-code preview: http://127.0.0.1:3002 · Firebase Auth emulator only');
for (const signal of ['SIGINT', 'SIGTERM'] as const) process.on(signal, () => server.close(() => process.exit(0)));
