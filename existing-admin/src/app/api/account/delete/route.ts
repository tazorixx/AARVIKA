import { NextResponse } from "next/server";

import { AccountDeletionError, deleteCustomerAccount } from "@/lib/account/deletion";
import { getAdminDb, verifyBearerToken } from "@/lib/firebase-admin";

export const runtime = "nodejs";

export async function DELETE(request: Request) {
  try {
    const { uid } = await verifyBearerToken(request);
    const body = await request.json().catch(() => ({})) as { confirm?: unknown };
    if (body.confirm !== "DELETE") {
      return NextResponse.json(
        { error: "Type DELETE to confirm permanent account deletion.", code: "DELETE_CONFIRMATION_REQUIRED" },
        { status: 400 },
      );
    }

    const result = await deleteCustomerAccount(getAdminDb(), uid);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    if (error instanceof AccountDeletionError) {
      return NextResponse.json(
        { error: error.message, code: error.code, ...error.details },
        { status: error.status },
      );
    }
    const message = error instanceof Error ? error.message : "Unable to delete your account.";
    const unauthorized = /bearer token|invalid token/i.test(message);
    console.error("DELETE /api/account/delete failed:", unauthorized ? "Unauthorized" : error);
    return NextResponse.json(
      { error: unauthorized ? "Unauthorized." : "Unable to delete your account right now." },
      { status: unauthorized ? 401 : 500 },
    );
  }
}
