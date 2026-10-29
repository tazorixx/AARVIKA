# AARVIKA mobile — demo development

Independent Expo / React Native TypeScript customer app. Existing admin and production services are not connected.

```sh
cd apps/mobile
npm ci
npm start
# browser preview
npm run web
# device: scan the Expo QR with a matching Expo Go version
npm run android
npm run ios
```

iOS simulator requires macOS. Native builds and device QA remain separate from browser viewport evidence. No EAS build or deployment is configured.

Verification: `npm run typecheck`, `npm run lint`, `npm test`; with Expo running on port 8081, `npx playwright test`.

Architecture: routes in `src/app`, shared UI in `src/components`, domain contracts/logic in `src/domain`, fixture adapters in `src/services`. Local demo data is never merchant inventory. No payments are accepted. Production auth, private uploads, secure checkout and Firestore rules require isolated staging integration in Task 10.

Setup follows https://docs.expo.dev/router/installation/ and https://docs.expo.dev/versions/v58.0.0/.

Tasks 01–05 results and known limits: [implementation report](evidence/RESULT_TASKS_01_TO_05.md). Per-task reports, screenshots and exact file list are in `evidence/`.

Environment verification and Tasks 06–09: [separate completion/test reports](evidence/RESULT_TASKS_06_TO_09.md). This build reads `EXPO_PUBLIC_APP_ENV` and `EXPO_PUBLIC_DATA_MODE`, supports fixture mode only and rejects live/API/Firebase modes. `.env.local` stays ignored. Firebase config is unused; local profiles, uploads and inquiries are demonstrations, not trusted services.

Local exported-app verification (no deployment): `npx expo export --platform all --output-dir dist`, then `python scripts/serve-preview.py`. In another terminal set `E2E_BASE_URL=http://127.0.0.1:8082` and run `npx playwright test`. Set `CHROME_PATH` if Chrome is installed elsewhere.
