# AARVIKA shared deployment

The mobile storefront and the existing admin are packaged together for the `aarvika` Firebase App Hosting backend in `gift4u-4210f`, region `asia-southeast1`.

Live deployment (29 October 2026):

- [Mobile storefront](https://aarvika--gift4u-4210f.asia-southeast1.hosted.app/)
- [Admin sign-in](https://aarvika--gift4u-4210f.asia-southeast1.hosted.app/admin/login)

The deployed source is commit `4de6261` on `codex/admin-team-handoff`. Firebase confirmed the successful rollout. Live checks passed for the published catalogue, mobile homepage and its image assets, Birthday deep link, real email account interface, and rejection of unauthenticated admin requests. The feed has eight departments, 48 categories and zero published products at verification time.

The intended administrator's UID, verified email and SUPER_ADMIN claim were confirmed read-only. However, Firebase rejected the password in the private local configuration. Authenticated online admin access and its ImageKit signature endpoint therefore still need verification with the owner's current password. No password, role, account or catalogue record was changed during deployment. The approved ImageKit key is stored in Secret Manager and referenced only by the server.

- `/`: the existing mobile UI, compiled for browsers with the real published catalogue.
- `/admin`: the existing protected admin panel.
- `/api/mobile/v2/catalog`: the published catalogue shared by both.

The browser storefront resolves its API from its own HTTPS origin. It does not require choosing between local ports or sample/live versions. Local fixture and emulator launchers remain available for development and rollback; production rejects fixture mode.

## Editing the online catalogue

1. Open `/admin` and sign in with an authorized Firebase administrator account.
2. The owner can use **Admin users** to manage approved teammates. Use **CATALOG_MANAGER** for colleagues responsible for products, categories and imagery. Do not share the owner's password.
3. In **Categories**, add/edit the category, select its department and parent, and upload its thumbnail. Main, subcategory and child records keep stable IDs.
4. In the relevant department merchandising editor, change hero images and shortcut content. Use the existing homepage manager for editable section titles, placement, ordering and visibility.
5. For products, use the existing universal product editor; choose a category and department, upload photos, and enter genuine price and SKU inventory. Save drafts while working and publish only complete records.
6. Publish the relevant visual/layout draft. An upload alone is not publication. The storefront refreshes published catalogue data every 30 seconds and when returning to the app; a browser refresh also reloads it.

The detailed fields and buttons are documented in [the team guide](AARVIKA_ADMIN_TEAM_GUIDE.md).

## Source deployment

Prerequisites: Node 24, an authenticated Firebase CLI with deployment access, and the existing approved ImageKit secret in Secret Manager. All source paths are retained in the repository; the admin is the build root.

```powershell
npm ci --prefix existing-admin
node existing-admin/node_modules/firebase-tools/lib/bin/firebase.js deploy --only apphosting:aarvika --config firebase.apphosting.json --project gift4u-4210f
```

`existing-admin/apphosting.yaml` holds public Firebase SDK values and a **reference** to `aarvika-imagekit-private-key`. The actual private key is not in Git. The runtime uses Google's managed application-default credentials, with exact-project checks and the existing Firebase role validation. Never add service-account private keys to the mobile app or the repository.

The build exports Expo web into the ignored `existing-admin/public/storefront/` folder, then builds the existing Next.js admin. Firebase serves this as one backend. Source deployment excludes local secrets, logs, tools, archives, worker state and downloaded original media. It does not deploy Firestore rules, run seeds, or migrate records.

This backend was created for explicit source deployments. GitHub pushes do not automatically deploy unless an owner separately connects the repository and configures rollouts in Firebase.

## Rollback and limits

Use the Firebase App Hosting console to roll back to a previous successful rollout. Local isolated launchers are unchanged. Stop shared processes before running an isolated server on the same port.

The published feed contains only real eligible products and active categories. Sample products are never substituted when the real catalogue is empty. Unconfigured pages reuse the approved presentation and hero artwork; published admin records take precedence.

This deployment unifies catalogue publishing and admin access. It does **not** enable payments or turn local review/inquiry drafts into placed orders. Cart, reminders and saved address state currently remain on the device. Real customer email/password authentication is available; six-digit email OTP needs the separately configured mail backend. Native Android/iOS distribution is a separate release from this mobile-friendly hosted web app.
