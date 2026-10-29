import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const credentialsPath = path.resolve(
  process.cwd(),
  ".credentials",
  "gift4u-firebase-adminsdk.json"
);

if (!fs.existsSync(credentialsPath)) {
  throw new Error(
    `Missing ${credentialsPath}. Download the Firebase service-account JSON and place it there. The path is gitignored.`
  );
}

const serviceAccount = JSON.parse(fs.readFileSync(credentialsPath, "utf8"));
const app = getApps().length
  ? getApps()[0]
  : initializeApp({ credential: cert(serviceAccount) });
const auth = getAuth(app);

const identifier = process.argv[2]?.trim();
if (!identifier) {
  console.error("Usage: node scripts/bootstrap-super-admin.mjs <firebase-auth-uid-or-email>");
  process.exit(1);
}

const user = identifier.includes("@")
  ? await auth.getUserByEmail(identifier)
  : await auth.getUser(identifier);

await auth.setCustomUserClaims(user.uid, { role: "SUPER_ADMIN" });

console.log(`SUPER_ADMIN assigned to ${user.email ?? user.uid}.`);
console.log("The user must obtain a fresh ID token (sign out/in or force-refresh the token) before the new claim is visible.");
