# Gift4U — Step 4 Fix 2

## Updated
- `src/lib/firebase-admin.ts`
  - Removed the runtime `server-only` import because the Node-based payment test directly imports the webhook route and Node executes the `server-only` package guard. The Firebase Admin module remains server-only by its usage/import graph in Next.js API/server modules.
- `package.json`
  - Removed the now-unused `server-only` dependency.

## Why
The previous fix added `server-only` to resolve a missing-module error. That made the package available but caused Node's test runner to intentionally throw when the webhook route was imported outside the Next.js Server Component runtime. This fix removes that test-runtime incompatibility.
