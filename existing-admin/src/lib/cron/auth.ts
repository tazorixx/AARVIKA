import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

function matchesSecret(received: string, expected: string) {
  const left = Buffer.from(received, "utf8");
  const right = Buffer.from(expected, "utf8");
  return left.length === right.length && timingSafeEqual(left, right);
}

/**
 * Development may run cron routes without a secret for local testing.
 * Production fails closed when CRON_SECRET is missing or invalid.
 */
export function cronAuthorizationError(request: Request) {
  const secret = process.env.CRON_SECRET?.trim() || "";
  if (!secret) {
    return process.env.NODE_ENV === "production"
      ? NextResponse.json({ error: "Cron authentication is not configured." }, { status: 503 })
      : null;
  }

  const authorization = request.headers.get("authorization") || "";
  const expected = `Bearer ${secret}`;
  return matchesSecret(authorization, expected)
    ? null
    : NextResponse.json({ error: "Unauthorized." }, { status: 401 });
}
