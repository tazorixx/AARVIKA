import { config as loadEnv } from "dotenv";
import { disableCloudAdminCommand } from "./disable-cloud-admin";

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

type ServiceAccountJson = {
  project_id: string;
  client_email: string;
  private_key: string;
};

disableCloudAdminCommand();
loadEnv({ path: resolve(process.cwd(), ".env.local") });

const serviceAccountPath = resolve(
  process.cwd(),
  ".credentials",
  "gift4u-firebase-adminsdk.json",
);

function loadServiceAccount(): ServiceAccountJson {
  if (!existsSync(serviceAccountPath)) {
    throw new Error(`Missing ${serviceAccountPath}`);
  }

  const parsed = JSON.parse(
    readFileSync(serviceAccountPath, "utf8"),
  ) as Partial<ServiceAccountJson>;

  if (
    typeof parsed.project_id !== "string" ||
    typeof parsed.client_email !== "string" ||
    typeof parsed.private_key !== "string"
  ) {
    throw new Error(
      "Invalid service-account JSON. Required fields: project_id, client_email, private_key.",
    );
  }

  return {
    project_id: parsed.project_id,
    client_email: parsed.client_email,
    private_key: parsed.private_key,
  };
}

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const uid = process.env.ADMIN_UID?.trim();

  if ((email && uid) || (!email && !uid)) {
    throw new Error(
      "Set exactly one of ADMIN_EMAIL or ADMIN_UID before running this script.",
    );
  }

  const serviceAccount = loadServiceAccount();
  const app =
    getApps()[0] ??
    initializeApp({
      credential: cert({
        projectId: serviceAccount.project_id,
        clientEmail: serviceAccount.client_email,
        privateKey: serviceAccount.private_key.replace(/\\n/g, "\n"),
      }),
    });

  const auth = getAuth(app);
  const user = uid ? await auth.getUser(uid) : await auth.getUserByEmail(email!);
  const claims = user.customClaims ?? {};

  console.log(`Firebase project: ${serviceAccount.project_id}`);
  console.log(`Account: ${user.email ?? "(no email)"}`);
  console.log(`UID: ${user.uid}`);
  console.log(`Disabled: ${user.disabled}`);
  console.log(`Email verified: ${user.emailVerified}`);
  console.log(`Role claim: ${String(claims.role ?? "none")}`);

  if (claims.role !== "SUPER_ADMIN") {
    console.error("RESULT: This account is NOT a SUPER_ADMIN.");
    process.exit(2);
  }

  console.log("RESULT: This account is a SUPER_ADMIN.");
}

main().catch((error) => {
  console.error("Verification failed.");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
