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

const SERVICE_ACCOUNT_PATH = resolve(
  process.cwd(),
  ".credentials",
  "gift4u-firebase-adminsdk.json",
);

function loadServiceAccount(): ServiceAccountJson {
  if (!existsSync(SERVICE_ACCOUNT_PATH)) {
    throw new Error(
      `Firebase service-account file not found: ${SERVICE_ACCOUNT_PATH}`,
    );
  }

  let parsed: Partial<ServiceAccountJson>;

  try {
    parsed = JSON.parse(readFileSync(SERVICE_ACCOUNT_PATH, "utf8")) as Partial<ServiceAccountJson>;
  } catch (error) {
    throw new Error(
      `Unable to read or parse ${SERVICE_ACCOUNT_PATH}: ${
        error instanceof Error ? error.message : "invalid JSON"
      }`,
    );
  }

  if (
    typeof parsed.project_id !== "string" ||
    typeof parsed.client_email !== "string" ||
    typeof parsed.private_key !== "string"
  ) {
    throw new Error(
      "Invalid Firebase service-account JSON. Required fields: project_id, client_email, private_key.",
    );
  }

  return {
    project_id: parsed.project_id,
    client_email: parsed.client_email,
    private_key: parsed.private_key,
  };
}

function getTarget() {
  const uid = process.env.ADMIN_UID?.trim();
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();

  if (uid && email) {
    throw new Error("Set only one target: ADMIN_UID or ADMIN_EMAIL, not both.");
  }

  if (!uid && !email) {
    throw new Error(
      "No target supplied. Set ADMIN_EMAIL=<existing Firebase account email> or ADMIN_UID=<existing Firebase UID>.",
    );
  }

  return { uid, email };
}

async function main() {
  const serviceAccount = loadServiceAccount();
  const target = getTarget();

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

  console.log(`Firebase project: ${serviceAccount.project_id}`);
  console.log(`Service account: ${serviceAccount.client_email}`);

  const user = target.uid
    ? await auth.getUser(target.uid)
    : await auth.getUserByEmail(target.email!);

  console.log(`Target user: ${user.email ?? user.uid}`);
  console.log(`UID: ${user.uid}`);
  console.log(`Existing role: ${String(user.customClaims?.role ?? "none")}`);

  await auth.setCustomUserClaims(user.uid, {
    ...(user.customClaims ?? {}),
    role: "SUPER_ADMIN",
  });

  const updated = await auth.getUser(user.uid);
  const role = updated.customClaims?.role;

  if (role !== "SUPER_ADMIN") {
    throw new Error(
      `Firebase accepted the update but the verified role is ${String(role ?? "none")}, not SUPER_ADMIN.`,
    );
  }

  console.log("");
  console.log("SUPER_ADMIN bootstrap successful.");
  console.log(`Account: ${updated.email ?? updated.uid}`);
  console.log(`UID: ${updated.uid}`);
  console.log(`Verified role: ${role}`);
  console.log("");
  console.log("Next: sign out of Gift4U, sign in again, then open /admin.");
}

main().catch((error) => {
  console.error("");
  console.error("SUPER_ADMIN bootstrap failed.");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
