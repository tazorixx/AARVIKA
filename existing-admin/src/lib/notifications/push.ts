import { createHash } from "node:crypto";
import { FieldValue, type Firestore } from "firebase-admin/firestore";

export type PushPlatform = "android" | "ios";
export type PushAppVariant = "development" | "preview" | "production";

export type PushRegistrationInput = {
  token: string;
  platform: PushPlatform;
  appVariant: PushAppVariant;
  projectId: string;
};

export type ExpoPushResult = {
  sent: number;
  failed: number;
  invalidRemoved: number;
};

const PUSH_COLLECTION = "mobile_push_tokens";
const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

function tokenId(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function isExpoPushToken(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const token = value.trim();
  if (token.length < 20 || token.length > 220) return false;
  return /^(ExponentPushToken|ExpoPushToken)\[[A-Za-z0-9_-]+\]$/.test(token);
}

export function validatePushRegistration(input: unknown):
  | { ok: true; value: PushRegistrationInput }
  | { ok: false; error: string } {
  const body = (input || {}) as Record<string, unknown>;
  const token = typeof body.token === "string" ? body.token.trim() : "";
  const platform = body.platform;
  const appVariant = body.appVariant;
  const projectId = typeof body.projectId === "string" ? body.projectId.trim() : "";

  if (!isExpoPushToken(token)) return { ok: false, error: "Invalid Expo push token." };
  if (platform !== "android" && platform !== "ios") return { ok: false, error: "Invalid push platform." };
  if (appVariant !== "development" && appVariant !== "preview" && appVariant !== "production") {
    return { ok: false, error: "Invalid app variant." };
  }
  if (!/^[A-Za-z0-9-]{20,80}$/.test(projectId)) return { ok: false, error: "Invalid Expo project ID." };

  return { ok: true, value: { token, platform, appVariant, projectId } };
}

export async function registerPushToken(db: Firestore, userId: string, input: PushRegistrationInput) {
  const ref = db.collection(PUSH_COLLECTION).doc(tokenId(input.token));
  const existing = await ref.get();
  await ref.set({
    userId,
    token: input.token,
    platform: input.platform,
    appVariant: input.appVariant,
    projectId: input.projectId,
    active: true,
    ...(existing.exists ? {} : { createdAt: FieldValue.serverTimestamp() }),
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
}

export async function unregisterPushToken(db: Firestore, userId: string, token: string) {
  if (!isExpoPushToken(token)) return;
  const ref = db.collection(PUSH_COLLECTION).doc(tokenId(token));
  const snap = await ref.get();
  if (!snap.exists || snap.data()?.userId !== userId) return;
  await ref.delete();
}

function desiredVariant(): PushAppVariant {
  const configured = process.env.GIFT4U_PUSH_APP_VARIANT?.trim();
  if (configured === "development" || configured === "preview" || configured === "production") return configured;
  return process.env.NODE_ENV === "development" ? "development" : "production";
}

async function listUserPushDocs(db: Firestore, userId: string) {
  const snapshot = await db.collection(PUSH_COLLECTION).where("userId", "==", userId).limit(25).get();
  const variant = desiredVariant();
  return snapshot.docs.filter((doc) => {
    const data = doc.data();
    return data.active !== false && data.appVariant === variant && isExpoPushToken(data.token);
  });
}

export async function sendExpoPushToUser({
  db,
  userId,
  title,
  body,
  data,
}: {
  db: Firestore;
  userId: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}): Promise<ExpoPushResult> {
  const docs = await listUserPushDocs(db, userId);
  if (docs.length === 0) return { sent: 0, failed: 0, invalidRemoved: 0 };

  const messages = docs.map((doc) => ({
    to: String(doc.data().token),
    title: title.slice(0, 160),
    body: body.slice(0, 500),
    data: data || {},
    sound: "default",
    priority: "high" as const,
    channelId: "gift4u-updates",
  }));

  const headers: Record<string, string> = {
    Accept: "application/json",
    "Accept-Encoding": "gzip, deflate",
    "Content-Type": "application/json",
  };
  const accessToken = process.env.EXPO_PUSH_ACCESS_TOKEN?.trim();
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  const response = await fetch(EXPO_PUSH_URL, {
    method: "POST",
    headers,
    body: JSON.stringify(messages),
  });
  if (!response.ok) throw new Error(`Expo push service returned HTTP ${response.status}.`);

  const payload = await response.json() as { data?: Array<Record<string, unknown>>; errors?: unknown };
  if (!Array.isArray(payload.data)) throw new Error("Expo push service returned an invalid response.");

  let sent = 0;
  let failed = 0;
  let invalidRemoved = 0;

  for (let index = 0; index < docs.length; index += 1) {
    const ticket = payload.data[index] || {};
    if (ticket.status === "ok") {
      sent += 1;
      continue;
    }

    failed += 1;
    const details = ticket.details as Record<string, unknown> | undefined;
    if (details?.error === "DeviceNotRegistered") {
      await docs[index].ref.delete();
      invalidRemoved += 1;
    }
  }

  return { sent, failed, invalidRemoved };
}
