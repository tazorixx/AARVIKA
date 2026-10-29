import {createContext, useContext, useEffect, useState, type ReactNode} from 'react';
import {Platform} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {getApps, initializeApp} from 'firebase/app';
import * as FirebaseAuth from 'firebase/auth';
import {browserLocalPersistence, connectAuthEmulator, createUserWithEmailAndPassword, getAuth, initializeAuth, onAuthStateChanged, signInWithCustomToken, signInWithEmailAndPassword, signOut, type Auth, type Persistence} from 'firebase/auth';
import {environment} from '../config/environment';

const PROJECT_ID = 'demo-aarvika-local';
const EMAIL_KEY = 'aarvika:local-auth-email:v1';
const host = Platform.OS === 'android' ? '10.0.2.2' : '127.0.0.1';
const API_BASE = `http://${host}:3002`;
const EMULATOR_URL = `http://${host}:9099`;
const sharedAuth = environment.dataMode === 'shared-api' && process.env.EXPO_PUBLIC_CUSTOMER_AUTH_MODE === 'shared';
const localPreview = !sharedAuth && __DEV__ && (environment.appEnv === 'development' || environment.appEnv === 'test') && (Platform.OS !== 'web' || typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname));

interface Identity {uid: string; email: string}
interface EmailAuthState {
  available: boolean; real: boolean; ready: boolean; identity: Identity | null;
  requestCode(email: string): Promise<{previewCode: string; expiresInSeconds: number}>;
  verifyCode(email: string, code: string): Promise<void>;
  passwordSignIn(email: string, password: string): Promise<void>;
  passwordSignUp(email: string, password: string): Promise<void>;
  leave(): Promise<void>;
}

let authInstance: Auth | null = null;
function getLocalAuth() {
  if (!localPreview) throw new Error('Local email sign-in is available only in the development preview.');
  if (authInstance) return authInstance;
  const app = getApps().find(item => item.name === 'aarvika-local-auth') ?? initializeApp({apiKey: 'demo-aarvika-local-key', authDomain: `${PROJECT_ID}.firebaseapp.com`, projectId: PROJECT_ID, appId: 'demo-aarvika-local-app'}, 'aarvika-local-auth');
  // The React Native export is selected by Metro; TypeScript sees the browser declaration.
  const nativePersistence = (FirebaseAuth as typeof FirebaseAuth & {getReactNativePersistence(storage: typeof AsyncStorage): Persistence}).getReactNativePersistence;
  try {authInstance = initializeAuth(app, {persistence: Platform.OS === 'web' ? browserLocalPersistence : nativePersistence(AsyncStorage)});}
  catch (error) {if ((error as {code?: string}).code !== 'auth/already-initialized') throw error; authInstance = getAuth(app);}
  try {connectAuthEmulator(authInstance, EMULATOR_URL, {disableWarnings: true});}
  catch (error) {if ((error as {code?: string}).code !== 'auth/emulator-config-failed') throw error;}
  return authInstance;
}
function getSharedAuth() {
  if (!sharedAuth) throw new Error('Shared Firebase sign-in is not enabled.');
  if (authInstance) return authInstance;
  if (process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID !== 'gift4u-4210f' || !process.env.EXPO_PUBLIC_FIREBASE_API_KEY || !process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || !process.env.EXPO_PUBLIC_FIREBASE_APP_ID) throw new Error('Shared Firebase client configuration is incomplete.');
  const app = getApps().find(item => item.name === 'aarvika-shared-auth') ?? initializeApp({
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  }, 'aarvika-shared-auth');
  const nativePersistence = (FirebaseAuth as typeof FirebaseAuth & {getReactNativePersistence(storage: typeof AsyncStorage): Persistence}).getReactNativePersistence;
  try {authInstance = initializeAuth(app, {persistence: Platform.OS === 'web' ? browserLocalPersistence : nativePersistence(AsyncStorage)});}
  catch (error) {if ((error as {code?: string}).code !== 'auth/already-initialized') throw error; authInstance = getAuth(app);}
  return authInstance;
}
const getAuthClient = () => sharedAuth ? getSharedAuth() : getLocalAuth();

async function localPost<T>(path: string, input: Record<string, string>): Promise<T> {
  if (!localPreview) throw new Error('Local email sign-in is unavailable here.');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(API_BASE + path, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(input), signal: controller.signal});
    const body = await response.json() as {data?: T; error?: string};
    if (!response.ok || !body.data) throw new Error(body.error ?? 'Local sign-in could not continue.');
    return body.data;
  } catch (error) {
    if (error instanceof TypeError || (error as Error).name === 'AbortError') throw new Error('Local sign-in service is unavailable. Start the local email-code service and try again.');
    throw error;
  } finally {clearTimeout(timeout);}
}

const Context = createContext<EmailAuthState | null>(null);
export function EmailAuthProvider({children}: {children: ReactNode}) {
  const [ready, setReady] = useState(!localPreview && !sharedAuth);
  const [identity, setIdentity] = useState<Identity | null>(null);
  useEffect(() => {
    if (!localPreview && !sharedAuth) return;
    let active = true;
    let unsubscribe: (() => void) | undefined;
    try {
      unsubscribe = onAuthStateChanged(getAuthClient(), async user => {
        if (!active) return;
        const saved = sharedAuth ? null : await AsyncStorage.getItem(EMAIL_KEY).catch(() => null);
        let emailRecord: Identity | null = null;
        try {emailRecord = saved ? JSON.parse(saved) as Identity : null;} catch {await AsyncStorage.removeItem(EMAIL_KEY).catch(() => {});}
        if (active) {setIdentity(user ? {uid: user.uid, email: sharedAuth ? user.email ?? '' : emailRecord?.uid === user.uid ? emailRecord.email : ''} : null); setReady(true);}
      }, () => {if (active) setReady(true);});
    } catch {queueMicrotask(() => {if (active) setReady(true);});}
    return () => {active = false; unsubscribe?.();};
  }, []);

  const value: EmailAuthState = {
    available: localPreview || sharedAuth, real: sharedAuth, ready, identity,
    requestCode: async email => {
      if (sharedAuth) throw new Error('Use the Firebase email and password form for the shared project.');
      const requested = await localPost<{email: string; previewCode: string; expiresInSeconds: number}>('/v1/email/request', {email});
      return {previewCode: requested.previewCode, expiresInSeconds: requested.expiresInSeconds};
    },
    verifyCode: async (email, code) => {
      if (sharedAuth) throw new Error('Local email codes are not accepted by the shared Firebase project.');
      const verified = await localPost<{uid: string; email: string; customToken: string}>('/v1/email/verify', {email, code});
      const credential = await signInWithCustomToken(getLocalAuth(), verified.customToken);
      if (credential.user.uid !== verified.uid) throw new Error('Local identity did not match the verified email.');
      const next = {uid: verified.uid, email: verified.email};
      await AsyncStorage.setItem(EMAIL_KEY, JSON.stringify(next));
      setIdentity(next);
    },
    passwordSignIn: async (email, password) => {if (!sharedAuth) throw new Error('Shared sign-in is not enabled.'); const credential=await signInWithEmailAndPassword(getSharedAuth(),email.trim(),password);setIdentity({uid:credential.user.uid,email:credential.user.email??email.trim()});},
    passwordSignUp: async (email, password) => {if (!sharedAuth) throw new Error('Shared sign-up is not enabled.'); const credential=await createUserWithEmailAndPassword(getSharedAuth(),email.trim(),password);setIdentity({uid:credential.user.uid,email:credential.user.email??email.trim()});},
    leave: async () => {await signOut(getAuthClient()); if (!sharedAuth) await AsyncStorage.removeItem(EMAIL_KEY); setIdentity(null);},
  };
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useEmailAuth() {const value = useContext(Context); if (!value) throw new Error('EmailAuthProvider is required'); return value;}
