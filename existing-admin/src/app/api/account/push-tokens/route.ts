import { NextResponse } from "next/server";
import { getAdminDb, verifyBearerToken } from "@/lib/firebase-admin";
import {
  isExpoPushToken,
  registerPushToken,
  unregisterPushToken,
  validatePushRegistration,
} from "@/lib/notifications/push";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { uid } = await verifyBearerToken(request);
    const validation = validatePushRegistration(await request.json());
    if (!validation.ok) return NextResponse.json({ error: validation.error }, { status: 400 });

    await registerPushToken(getAdminDb(), uid, validation.value);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("POST /api/account/push-tokens failed:", error);
    return NextResponse.json({ error: "Unable to register this device for notifications." }, { status: 401 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { uid } = await verifyBearerToken(request);
    const body = await request.json() as { token?: unknown };
    const token = typeof body.token === "string" ? body.token.trim() : "";
    if (!isExpoPushToken(token)) return NextResponse.json({ error: "Invalid Expo push token." }, { status: 400 });

    await unregisterPushToken(getAdminDb(), uid, token);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/account/push-tokens failed:", error);
    return NextResponse.json({ error: "Unable to unregister this device." }, { status: 401 });
  }
}
