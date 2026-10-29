import { NextResponse } from "next/server";

import { verifyBearerToken } from "@/lib/firebase-admin";
import { cleanSessionToken, fetchPlacesAutocomplete } from "@/lib/places/server";
import { checkRateLimit, getClientKey, rateLimitResponse } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function GET(request: Request) {
  let uid: string;
  try {
    ({ uid } = await verifyBearerToken(request));
  } catch {
    return NextResponse.json({ error: "Please sign in to search addresses." }, { status: 401 });
  }

  const rate = checkRateLimit(`places-autocomplete:${uid}:${getClientKey(request)}`, 45, 60_000);
  if (!rate.allowed) return rateLimitResponse(rate.resetAt);

  const url = new URL(request.url);
  const input = (url.searchParams.get("q") || "").trim().slice(0, 160);
  const sessionToken = cleanSessionToken(url.searchParams.get("sessionToken"));
  if (input.length < 3) return NextResponse.json({ suggestions: [] });
  if (!sessionToken) return NextResponse.json({ error: "A valid address-search session is required." }, { status: 400 });

  try {
    const suggestions = await fetchPlacesAutocomplete(input, sessionToken);
    return NextResponse.json({ suggestions }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to search addresses.";
    const status = message.includes("not configured") ? 503 : 502;
    console.error("GET /api/places/autocomplete failed", error);
    return NextResponse.json({ error: status === 503 ? message : "Unable to search addresses right now." }, { status });
  }
}
