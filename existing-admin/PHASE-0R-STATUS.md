# Gift4U Phase 0R status

## Implemented in the root application

- Firebase web SDK foundation in `src/lib/firebase.ts`.
- Firebase Admin SDK foundation in `src/lib/firebase-admin.ts`.
- Firebase Auth hook/helper.
- `/admin/*` client guard with forced ID-token refresh.
- SUPER_ADMIN-only `/api/admin/set-role` route.
- ID-token verification endpoint.
- One-time local SUPER_ADMIN bootstrap script.
- Deny-by-default Firestore rules with public live-product reads and existing public page reads.
- Firestore emulator test suite.
- Repository credential hygiene entries.
- Firebase emulator configuration for Auth/Firestore.
- Existing `apps/web` moved to `_archive/apps-web-phase0-reference/` and is not part of the active application.

## Intentionally blocked until the user completes local setup

1. Link the real Firebase project with `firebase use --add`.
2. Create `.env.local` from `.env.example` with the real Firebase Web config.
3. Create `.credentials/gift4u-firebase-adminsdk.json` only after `.credentials/` is verified ignored.
4. Run `npm install` in the root application so the newly added Firebase/test dependencies are installed and the lockfile is regenerated with their full package entries.
5. Run `npm run build` after installation.
6. Run `npm run test:rules` after Firebase CLI/emulator dependencies are installed.

The hosting platform remains intentionally undecided. No Vercel, Netlify, or Firebase Hosting-specific application code is added in Phase 0R.
