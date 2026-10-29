/** Explicit connection to the owner's existing Firebase project. */
export const SHARED_PROJECT_ID = 'gift4u-4210f';
type Env = Record<string, string | undefined>;

export function assertSharedClient(env: Env) {
  if (env.NEXT_PUBLIC_AARVIKA_SHARED !== 'true' || env.NEXT_PUBLIC_AARVIKA_ISOLATED === 'true') throw new Error('Shared Firebase mode is not enabled.');
  if (env.NEXT_PUBLIC_FIREBASE_PROJECT_ID !== SHARED_PROJECT_ID) throw new Error('Unexpected shared Firebase project.');
  for (const key of ['NEXT_PUBLIC_FIREBASE_API_KEY', 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', 'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET', 'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID', 'NEXT_PUBLIC_FIREBASE_APP_ID']) {
    if (!env[key]?.trim()) throw new Error(`Missing shared Firebase setting: ${key}.`);
  }
}

export function assertSharedServer(env: Env = process.env) {
  assertSharedClient(env);
  if (env.AARVIKA_SHARED !== 'true' || env.AARVIKA_ISOLATED === 'true' || env.FIREBASE_PROJECT_ID !== SHARED_PROJECT_ID) throw new Error('Shared server mode or project is invalid.');
  if (env.FIREBASE_AUTH_EMULATOR_HOST || env.FIRESTORE_EMULATOR_HOST) throw new Error('Shared mode cannot use Firebase emulator endpoints.');
  if (env.AARVIKA_FIREBASE_CREDENTIALS === 'application-default') {
    if (env.AARVIKA_APPHOSTING !== 'true') throw new Error('Managed credentials require the explicit App Hosting mode.');
    if (env.FIREBASE_PRIVATE_KEY || env.FIREBASE_CLIENT_EMAIL) throw new Error('Do not mix managed credentials with a private service-account key.');
  } else if (!env.FIREBASE_CLIENT_EMAIL?.endsWith(`@${SHARED_PROJECT_ID}.iam.gserviceaccount.com`) || !env.FIREBASE_PRIVATE_KEY?.includes('BEGIN PRIVATE KEY')) throw new Error('Missing or mismatched server credential.');
  for (const key of ['GCLOUD_PROJECT', 'GOOGLE_CLOUD_PROJECT']) if (env[key] && env[key] !== SHARED_PROJECT_ID) throw new Error(`Unexpected ${key}.`);
}
