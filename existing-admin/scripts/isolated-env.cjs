/* global __dirname */
/* eslint-disable @typescript-eslint/no-require-imports -- Direct Node CommonJS launcher, not application TypeScript. */
const fs = require('node:fs');
const path = require('node:path');
require('tsx/cjs');
const { assertIsolatedServer, DEMO_PROJECT_ID, AUTH_EMULATOR_HOST, FIRESTORE_EMULATOR_HOST } = require('../src/lib/isolated.ts');
const projectRoot = path.resolve(__dirname, '..');
function isolatedEnv() {
  for (const name of fs.readdirSync(projectRoot)) {
    if (name.startsWith('.env') && name !== '.env.example') throw new Error('Isolated launcher refuses environment files; use its process-only demo configuration.');
  }
  for (const name of ['FIREBASE_PROJECT_ID', 'NEXT_PUBLIC_FIREBASE_PROJECT_ID', 'GCLOUD_PROJECT', 'GOOGLE_CLOUD_PROJECT']) {
    if (process.env[name] && process.env[name] !== DEMO_PROJECT_ID) throw new Error(`Refusing inherited project setting: ${name}.`);
  }
  const env = { ...process.env, AARVIKA_ISOLATED: 'true', NEXT_PUBLIC_AARVIKA_ISOLATED: 'true', FIREBASE_PROJECT_ID: DEMO_PROJECT_ID, NEXT_PUBLIC_FIREBASE_PROJECT_ID: DEMO_PROJECT_ID, GCLOUD_PROJECT: DEMO_PROJECT_ID, FIREBASE_AUTH_EMULATOR_HOST: AUTH_EMULATOR_HOST, FIRESTORE_EMULATOR_HOST, NEXT_TELEMETRY_DISABLED: '1', FIREBASE_CLI_DISABLE_TELEMETRY: 'true', NO_UPDATE_NOTIFIER: '1', CI: '1', FIREBASE_EMULATORS_PATH: path.resolve(projectRoot, '../.tools/firebase-emulators') };
  delete env.AARVIKA_SHARED;
  delete env.NEXT_PUBLIC_AARVIKA_SHARED;
  assertIsolatedServer(env);
  return env;
}
module.exports = { isolatedEnv, projectRoot };
