import test from 'node:test';
import assert from 'node:assert/strict';
import { assertSharedClient, assertSharedServer, SHARED_PROJECT_ID } from '../src/lib/shared';

const valid = {
  AARVIKA_SHARED: 'true', NEXT_PUBLIC_AARVIKA_SHARED: 'true',
  FIREBASE_PROJECT_ID: SHARED_PROJECT_ID, NEXT_PUBLIC_FIREBASE_PROJECT_ID: SHARED_PROJECT_ID,
  NEXT_PUBLIC_FIREBASE_API_KEY: 'test-public-key', NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: 'test.example',
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: 'test.example', NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: '123',
  NEXT_PUBLIC_FIREBASE_APP_ID: 'test-app',
  FIREBASE_CLIENT_EMAIL: `server@${SHARED_PROJECT_ID}.iam.gserviceaccount.com`, FIREBASE_PRIVATE_KEY: '-----BEGIN PRIVATE KEY-----\ntest',
};

test('shared mode requires exact project, credential and no emulator endpoints', () => {
  assert.doesNotThrow(() => assertSharedServer(valid));
  assert.doesNotThrow(() => assertSharedClient(valid));
  assert.throws(() => assertSharedClient({...valid, NEXT_PUBLIC_FIREBASE_PROJECT_ID:'demo-aarvika-local'}));
  assert.throws(() => assertSharedServer({...valid, FIREBASE_PROJECT_ID:'other'}));
  assert.throws(() => assertSharedServer({...valid, FIREBASE_AUTH_EMULATOR_HOST:'127.0.0.1:9099'}));
  assert.throws(() => assertSharedServer({...valid, FIREBASE_PRIVATE_KEY:undefined}));
  assert.throws(() => assertSharedServer({...valid, AARVIKA_ISOLATED:'true'}));
});
