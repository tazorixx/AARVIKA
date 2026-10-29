/* eslint-disable @typescript-eslint/no-require-imports -- Narrow local launcher for the existing Firebase project. */
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const { parse } = require('dotenv');
require('tsx/cjs');
const { assertSharedServer } = require('../src/lib/shared.ts');

if (process.argv[2] !== 'dev') throw new Error('Only local shared-project development is supported. No deploy or build command is provided.');
const projectRoot = path.resolve(__dirname, '..');
const source = process.env.AARVIKA_SHARED_ENV_FILE;
if (!source || !path.isAbsolute(source) || !fs.statSync(source, { throwIfNoEntry: false })?.isFile()) throw new Error('Set AARVIKA_SHARED_ENV_FILE to the existing private Firebase environment file.');
const settings = parse(fs.readFileSync(source));
const env = { ...process.env };
for (const key of Object.keys(env)) {
  if (/^(FIREBASE_|NEXT_PUBLIC_FIREBASE_|GCLOUD_PROJECT$|GOOGLE_CLOUD_PROJECT$|GOOGLE_APPLICATION_CREDENTIALS$|AARVIKA_ISOLATED$|NEXT_PUBLIC_AARVIKA_ISOLATED$)/.test(key)) delete env[key];
}
for (const key of ['FIREBASE_PROJECT_ID', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY', 'NEXT_PUBLIC_FIREBASE_API_KEY', 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', 'NEXT_PUBLIC_FIREBASE_PROJECT_ID', 'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET', 'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID', 'NEXT_PUBLIC_FIREBASE_APP_ID', 'IMAGEKIT_PUBLIC_KEY', 'IMAGEKIT_PRIVATE_KEY', 'IMAGEKIT_URL_ENDPOINT']) env[key] = settings[key];
env.AARVIKA_SHARED = 'true';
env.NEXT_PUBLIC_AARVIKA_SHARED = 'true';
env.NEXT_TELEMETRY_DISABLED = '1';
assertSharedServer(env);
const child = spawn(process.execPath, [path.join(projectRoot, 'node_modules/next/dist/bin/next'), 'dev', '--hostname', '127.0.0.1', '--port', '3100'], { cwd: projectRoot, env, stdio: 'inherit', windowsHide: true });
child.on('error', error => { console.error(error.message); process.exitCode = 1; });
child.on('exit', code => { process.exitCode = code ?? 1; });
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
