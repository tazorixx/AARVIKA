import { NextResponse } from "next/server";

import { verifyBearerToken } from "@/lib/firebase-admin";
import { cleanPlaceId, cleanSessionToken, fetchPlaceDetails } from "@/lib/places/server";
import { checkRateLimit, getClientKey, rateLimitResponse } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function GET(request: Request) {
  let uid: string;
  try {
    ({ uid } = await verifyBearerToken(request));
  } catch {
    return NextResponse.json({ error: "Please sign in to load address details." }, { status: 401 });
  }

  const rate = checkRateLimit(`places-details:${uid}:${getClientKey(request)}`, 30, 60_000);
  if (!rate.allowed) return rateLimitResponse(rate.resetAt);

  const url = new URL(request.url);
  const placeId = cleanPlaceId(url.searchParams.get("placeId"));
  const sessionToken = cleanSessionToken(url.searchParams.get("sessionToken"));
  if (!placeId || !sessionToken) return NextResponse.json({ error: "Invalid address selection." }, { status: 400 });

  try {
    const address = await fetchPlaceDetails(placeId, sessionToken);
    return NextResponse.json({ address }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load address details.";
    const status = message.includes("not configured") ? 503 : 502;
    console.error("GET /api/places/details failed", error);
    return NextResponse.json({ error: status === 503 ? message : "Unable to load address details right now." }, { status });
  }
}
