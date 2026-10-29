import { NextResponse } from "next/server";
import { getAdminDb, verifyBearerToken } from "@/lib/firebase-admin";
import { sendExpoPushToUser } from "@/lib/notifications/push";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  try {
    const { uid } = await verifyBearerToken(request);
    const result = await sendExpoPushToUser({
      db: getAdminDb(),
      userId: uid,
      title: "Gift4U notifications are ready",
      body: "Tap to open your orders. Future Gift4U updates can arrive here.",
      data: { type: "test", url: "/orders" },
    });
    if (result.sent === 0 && result.failed === 0) {
      return NextResponse.json({ error: "No registered Gift4U device was found for this account." }, { status: 409 });
    }
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("POST /api/account/push-tokens/test failed:", error);
    return NextResponse.json({ error: "Unable to send a test notification." }, { status: 500 });
  }
}
