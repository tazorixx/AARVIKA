# AARVIKA — mobile app and existing admin

This repository contains the current AARVIKA source snapshot: the existing Next.js admin, Expo customer app, shared catalogue contracts, local development services and web preview. Clone the **whole repository**: the admin imports shared code from `packages/catalogue`.

The repository contains code and public display assets, not Firebase account records, private keys, passwords or a database backup. Uploading this source to GitHub does not host the admin or grant administrator access. This is a development handoff, not a claim that production checkout, payments or every native-device flow is release-tested.

## Start here

- [Step-by-step admin team guide](AARVIKA_ADMIN_TEAM_GUIDE.md): products, category/subcategory images, variants, banners, homepage sections and publishing.
- `existing-admin/`: the full existing admin implementation, preserving its template and navigation.
- `apps/mobile/`: the customer application, including the current compact cards, hero images and static category rail.
- `packages/catalogue/`: shared category hierarchy, contracts and sample catalogue.
- `apps/local-api/` and `apps/local-auth/`: local development services.
- `apps/web/`: the separate web preview.
- `tasks/`, `references/` and root design documents: requirements and historical context. Follow the startup modes below for this snapshot.

Local bulk-image worker state, source-image archives, private configuration, generated builds and diagnostic screenshots are intentionally excluded. Public image mappings and application assets needed by the app remain included. No image automation starts when the admin starts.

## 1. Get the code

Install Git and Node.js 24 (the handoff was checked with Node 24.19.0). In PowerShell:

```powershell
git clone --branch codex/admin-team-handoff https://github.com/tazorixx/AARVIKA.git
cd AARVIKA
npm ci --prefix existing-admin
```

Keep the complete folder structure. Do not run commands from an old partial source archive. The install needs internet access; dependencies and generated build folders are not committed.

## 2. Configure the real admin privately

An authorized project owner must supply the existing Firebase and ImageKit settings through a private channel. A Firebase browser API key alone cannot run the server-side admin. Do not create replacement accounts or change roles just to make a local clone start.

1. Copy `config/shared-admin.env.example` to a private location **outside this repository**, such as `C:\Users\YOUR_NAME\AARVIKA-private\admin.env`.
2. Replace every placeholder with the authorized settings for **gift4u-4210f**. Preserve the actual storage bucket and web-app identifiers supplied by the owner.
3. Keep the Firebase private key quoted on one line with `\n` escapes, as in the existing authorized configuration.
4. Never put Firebase service-account or ImageKit private keys into mobile files or `EXPO_PUBLIC_*` variables.
5. Do not put a live `.env.local` inside `existing-admin`: its isolated launcher deliberately rejects local environment files.

Start from the repository root:

```powershell
$env:AARVIKA_SHARED_ENV_FILE = 'C:\Users\YOUR_NAME\AARVIKA-private\admin.env'
npm run dev:shared --prefix existing-admin
```

Open **http://127.0.0.1:3100/admin**. Keep the terminal running. Log in using an existing authorized Firebase administrator identity. The application checks the role and, for protected publishing operations, genuine email verification. GitHub access does not grant Firebase admin access. Ask the owner to arrange approved access for a teammate; do not share passwords or bypass these checks.

This launch mode connects to the **real shared project**. Saving or publishing can change the live catalogue. Start by reading existing records and use the team guide before making authorized edits. This mode intentionally supports local development only; it does not deploy a hosted admin.

## 3. Open the complete sample mobile design

Use this mode to see the complete earlier storefront with clearly labelled sample products. It does not display new real-admin product edits.

In a second PowerShell terminal at the repository root:

```powershell
cd apps/mobile
npm ci --workspaces=false
$env:EXPO_PUBLIC_APP_ENV = 'development'
$env:EXPO_PUBLIC_DATA_MODE = 'fixture'
$env:EXPO_PUBLIC_CUSTOMER_AUTH_MODE = 'local'
$env:EXPO_NO_DOTENV = '1'
node scripts/start-expo.cjs --web --offline --port 8086
```

Open **http://127.0.0.1:8086/**. The offline switch disables Expo CLI network checks; ImageKit photos still require internet. Sample sign-in requires the separate local Auth service described in `apps/local-auth/README.md`; it is not real customer email delivery.

## 4. View real published admin changes in mobile

Keep the real admin running on port 3100. Open a **fresh** PowerShell terminal so fixture settings do not carry over:

```powershell
cd apps/mobile
node scripts/start-shared-api.cjs
```

Open **http://127.0.0.1:8085/**. This mode reads the admin's public catalogue API. Only eligible published content appears; it can show fewer products than the sample design. Uploading a photo does not publish a product or a saved layout draft. Refresh the page after publishing and check the correct department.

Real customer sign-in also requires the existing Firebase **public client configuration** in the mobile environment: `EXPO_PUBLIC_FIREBASE_PROJECT_ID`, `EXPO_PUBLIC_FIREBASE_API_KEY`, `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN` and `EXPO_PUBLIC_FIREBASE_APP_ID`. Supply the authorized web-app values before starting the preview. Never copy server private credentials to mobile. A phone's `127.0.0.1` points to the phone itself; these commands describe a browser preview on the developer's computer, not a remotely hosted or physical-phone deployment.

## 5. Keep isolated development available

The existing `npm run dev --prefix existing-admin` launcher uses the isolated local project; it is separate from `dev:shared`. Start Auth/Firestore with `npm run emulators --prefix existing-admin`, then start the admin in a second terminal. The emulator requires a Firebase-compatible Java installation and its own local data; this snapshot does not include a pre-created local admin account. No live environment file should be placed inside the admin directory. Do not run isolated and shared admin servers on port 3100 at the same time.

## Troubleshooting

| Problem | Check |
| --- | --- |
| Admin does not start | All template placeholders replaced; private file exists at the absolute path; port 3100 is free. |
| Wrong email/password | Correct Firebase project and authorized identity; use the legitimate password-reset/account process. |
| Login works but publishing is denied | Actual role and verified email; complete verification, then sign in again. |
| Upload fails | Server ImageKit configuration and authorized session; never move the private key into browser code. |
| Admin changes not visible | Use 8085, not the sample preview on 8086; publish the correct record/draft, then refresh. |
| Missing generated Next type files on a fresh clone | Start the admin once to generate Next types before standalone TypeScript checking. |
| Friend cannot open your localhost link | They must run their clone locally or use a separately authorized hosted deployment. |

## Handoff boundaries

No Firebase data, roles, passwords, deployment configuration or production records are changed by this handoff. Existing source-level guardrails remain. Public CDN links require the owner's ImageKit assets to remain available. Never commit the filled private environment file, downloaded account exports, access tokens or service-account keys. Historical task reports describe earlier checks; they are not a new production certification.
