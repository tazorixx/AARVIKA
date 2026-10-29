import test from 'node:test';
import assert from 'node:assert/strict';
import { assertIsolatedClient, assertIsolatedServer, DEMO_PROJECT_ID, AUTH_EMULATOR_HOST, FIRESTORE_EMULATOR_HOST } from '../src/lib/isolated';
const valid = { AARVIKA_ISOLATED: 'true', NEXT_PUBLIC_AARVIKA_ISOLATED: 'true', FIREBASE_PROJECT_ID: DEMO_PROJECT_ID, NEXT_PUBLIC_FIREBASE_PROJECT_ID: DEMO_PROJECT_ID, FIREBASE_AUTH_EMULATOR_HOST: AUTH_EMULATOR_HOST, FIRESTORE_EMULATOR_HOST };
test('isolated setup accepts only the exact demo project and both loopback endpoints', () => {
  assert.doesNotThrow(() => assertIsolatedServer(valid));
  for (const key of Object.keys(valid)) assert.throws(() => assertIsolatedServer({ ...valid, [key]: undefined }));
  for (const value of ['gift4u-4210f', 'demo-other', '']) assert.throws(() => assertIsolatedClient('true', value));
  for (const host of ['remote.example:8080', '127.0.0.1:80', 'http://127.0.0.1:8080']) assert.throws(() => assertIsolatedServer({ ...valid, FIRESTORE_EMULATOR_HOST: host }));
});
test('credentials and provider keys cannot enter the isolated application', () => {
  for (const key of ['GOOGLE_APPLICATION_CREDENTIALS', 'FIREBASE_PRIVATE_KEY', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_CONFIG', 'FIREBASE_TOKEN', 'IMAGEKIT_PRIVATE_KEY', 'RAZORPAY_KEY_ID', 'BREVO_API_KEY', 'TWILIO_AUTH_TOKEN', 'NEXT_PUBLIC_FIREBASE_API_KEY']) assert.throws(() => assertIsolatedServer({ ...valid, [key]: 'test-value-not-a-credential' }));
  assert.throws(() => assertIsolatedServer({ ...valid, GCLOUD_PROJECT: 'gift4u-4210f' }));
});
