import { NextResponse } from "next/server";
import { verifyBearerToken } from "../../../../lib/firebase-admin";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const decoded = await verifyBearerToken(request);

    return NextResponse.json({
      uid: decoded.uid,
      role: decoded.role,
    });
  } catch {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }
}