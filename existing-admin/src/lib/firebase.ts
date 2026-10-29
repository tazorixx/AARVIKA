import { getApp, getApps, initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth } from "firebase/auth";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";
import { assertIsolatedClient, AUTH_EMULATOR_HOST, DEMO_PROJECT_ID, FIRESTORE_EMULATOR_HOST } from "./isolated";
import { assertSharedClient, SHARED_PROJECT_ID } from "./shared";

const shared = process.env.NEXT_PUBLIC_AARVIKA_SHARED === 'true';
const publicSettings = {
  NEXT_PUBLIC_AARVIKA_SHARED: process.env.NEXT_PUBLIC_AARVIKA_SHARED,
  NEXT_PUBLIC_AARVIKA_ISOLATED: process.env.NEXT_PUBLIC_AARVIKA_ISOLATED,
  NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};
if (shared) assertSharedClient(publicSettings);
else assertIsolatedClient(process.env.NEXT_PUBLIC_AARVIKA_ISOLATED, process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
const firebaseConfig = shared ? {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: SHARED_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
} : { apiKey: 'demo-aarvika-local-key', projectId: DEMO_PROJECT_ID, authDomain: '127.0.0.1', appId: 'demo-aarvika-local-app' };
const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
if (firebaseApp.options.projectId !== (shared ? SHARED_PROJECT_ID : DEMO_PROJECT_ID)) throw new Error('Firebase client project does not match its selected mode.');
export { firebaseApp };
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
const registry = globalThis as typeof globalThis & { __aarvikaEmulatorApps?: WeakSet<object> };
registry.__aarvikaEmulatorApps ??= new WeakSet();
if (!shared && !registry.__aarvikaEmulatorApps.has(firebaseApp)) {
  connectAuthEmulator(auth, `http://${AUTH_EMULATOR_HOST}`, { disableWarnings: true });
  const [host, port] = FIRESTORE_EMULATOR_HOST.split(":");
  connectFirestoreEmulator(db, host, Number(port));
  registry.__aarvikaEmulatorApps.add(firebaseApp);
}
export function assertFirebaseClientConfig() {
  if (shared) assertSharedClient(publicSettings);
  else assertIsolatedClient(process.env.NEXT_PUBLIC_AARVIKA_ISOLATED, process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
}
