/** This copied application is an emulator-only development workspace. */
export const DEMO_PROJECT_ID = "demo-aarvika-local";
export const AUTH_EMULATOR_HOST = "127.0.0.1:9099";
export const FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";

export function assertIsolatedClient(mode: string | undefined, project: string | undefined) {
  if (mode !== "true" || project !== DEMO_PROJECT_ID) {
    throw new Error("This admin copy requires its isolated launcher and demo-only Firebase project. Cloud fallback is disabled.");
  }
}

export function assertIsolatedServer(env: Record<string, string | undefined> = process.env) {
  assertIsolatedClient(env.NEXT_PUBLIC_AARVIKA_ISOLATED, env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
  if (env.AARVIKA_ISOLATED !== "true" || env.FIREBASE_PROJECT_ID !== DEMO_PROJECT_ID || env.FIREBASE_AUTH_EMULATOR_HOST !== AUTH_EMULATOR_HOST || env.FIRESTORE_EMULATOR_HOST !== FIRESTORE_EMULATOR_HOST) {
    throw new Error("Isolated admin requires the exact demo project and loopback Auth/Firestore emulator endpoints. No fallback is permitted.");
  }
  for (const key of ["GCLOUD_PROJECT", "GOOGLE_CLOUD_PROJECT"]) {
    if (env[key] && env[key] !== DEMO_PROJECT_ID) throw new Error(`Unsafe project configuration: ${key}.`);
  }
  const forbidden = Object.keys(env).filter(key => env[key] && (
    /^(GOOGLE_APPLICATION_CREDENTIALS|FIREBASE_CONFIG|FIREBASE_TOKEN|FIREBASE_PRIVATE_KEY|FIREBASE_CLIENT_EMAIL)$/.test(key) ||
    /^(IMAGEKIT_|RAZORPAY_|STRIPE_|TWILIO_|BREVO_API_KEY|GOOGLE_PLACES_SERVER_API_KEY|NEXT_PUBLIC_GOOGLE_MAPS_API_KEY)/.test(key) ||
    (key.startsWith("NEXT_PUBLIC_FIREBASE_") && key !== "NEXT_PUBLIC_FIREBASE_PROJECT_ID")
  ));
  if (forbidden.length) throw new Error(`Isolated admin refuses credential/provider configuration: ${forbidden.join(", ")}.`);
}
