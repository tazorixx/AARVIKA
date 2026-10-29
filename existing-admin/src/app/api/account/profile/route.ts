import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb, verifyBearerToken } from "../../../../lib/firebase-admin";

export const runtime = "nodejs";

function cleanText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

export async function GET(request: Request) {
  try {
    const { uid } = await verifyBearerToken(request);
    const db = getAdminDb();
    const snapshot = await db.collection("users").doc(uid).get();
    const data = snapshot.exists ? snapshot.data() ?? {} : {};

    return NextResponse.json({
      exists: snapshot.exists,
      profile: {
        uid,
        name: cleanText(data.name, 100),
        phone: cleanText(data.phone, 20),
        email: cleanText(data.email, 160),
      },
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { uid } = await verifyBearerToken(request);
    const body = await request.json().catch(() => ({}));
    const name = cleanText(body.name, 100);
    const phone = cleanText(body.phone, 20);

    if (!name) {
      return NextResponse.json(
        { error: "Please enter your name." },
        { status: 400 },
      );
    }

    const db = getAdminDb();
    const userRef = db.collection("users").doc(uid);
    const authUser = await (await import("../../../../lib/firebase-admin")).getAdminAuth().getUser(uid);

    const existing = await userRef.get();
    const profileData: Record<string, unknown> = {
      uid,
      name,
      phone,
      email: authUser.email ?? "",
      updatedAt: FieldValue.serverTimestamp(),
    };
    if (!existing.exists) profileData.createdAt = FieldValue.serverTimestamp();

    await userRef.set(profileData, { merge: true });

    return NextResponse.json({
      profile: { uid, name, phone, email: authUser.email ?? "" },
    });
  } catch (error) {
    console.error("Profile update failed:", error);
    return NextResponse.json(
      {
        error: "Unable to create/update your Gift4U profile right now.",
        ...(process.env.NODE_ENV !== "production" && error instanceof Error
          ? { detail: error.message }
          : {}),
      },
      { status: 500 },
    );
  }
}
