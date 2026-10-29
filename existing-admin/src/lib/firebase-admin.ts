import { assertIsolatedServer, DEMO_PROJECT_ID } from "./isolated";
import { assertSharedServer, SHARED_PROJECT_ID } from './shared';
import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

export const ADMIN_ROLES = [
  "SUPER_ADMIN",
  "ADMIN",
  "CATALOG_MANAGER",
  "ORDER_MANAGER",
  "SUPPORT",
] as const;

export type AdminRole = (typeof ADMIN_ROLES)[number];

export function isAdminRole(value: string): value is AdminRole {
  return (ADMIN_ROLES as readonly string[]).includes(value);
}

let adminApp: App | undefined;

function getAdminApp(): App {
  const shared = process.env.AARVIKA_SHARED === 'true';
  if (shared) assertSharedServer();
  else assertIsolatedServer();
  if (adminApp) return adminApp;

  const existingApp = getApps().find((app) => app.name === "[DEFAULT]");

  if (existingApp) {
    if (existingApp.options.projectId !== (shared ? SHARED_PROJECT_ID : DEMO_PROJECT_ID)) throw new Error('Firebase Admin project does not match its selected mode.');
    adminApp = existingApp;
    return adminApp;
  }

  adminApp = shared
    ? initializeApp({ projectId: SHARED_PROJECT_ID, credential: cert({
      projectId: SHARED_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
      privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
    }) })
    : initializeApp({ projectId: DEMO_PROJECT_ID });

  return adminApp;
}

export function getAdminAuth(): Auth {
  return getAuth(getAdminApp());
}

export function getAdminDb(): Firestore {
  return getFirestore(getAdminApp());
}

export const adminAuth = new Proxy({} as Auth, {
  get(_target, property) {
    const service = getAdminAuth();
    const value = Reflect.get(service, property, service);

    return typeof value === "function" ? value.bind(service) : value;
  },
});

export const adminDb = new Proxy({} as Firestore, {
  get(_target, property) {
    const service = getAdminDb();
    const value = Reflect.get(service, property, service);

    return typeof value === "function" ? value.bind(service) : value;
  },
});

export async function verifyBearerToken(
  request: Request,
): Promise<{ uid: string; role: AdminRole | null }> {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    throw new Error("Missing bearer token.");
  }

  const token = authorization.slice("Bearer ".length).trim();

  if (!token) {
    throw new Error("Missing bearer token.");
  }

  const decodedToken = await getAdminAuth().verifyIdToken(token);
  const rawRole = decodedToken.role;

  return {
    uid: decodedToken.uid,
    role:
      typeof rawRole === "string" && isAdminRole(rawRole)
        ? rawRole
        : null,
  };
}
