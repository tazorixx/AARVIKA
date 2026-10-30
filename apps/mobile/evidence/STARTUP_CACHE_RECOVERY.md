# Intermittent blank startup — 30 October 2026

Observed the owner's blank browser tab: empty app root and old `__common-649fdcec…js` / `entry-18820e18…js` references. Both referenced files returned HTTP 404. A direct fresh document referenced `__common-0f7fac9b…js` / `entry-62a1e732…js` instead. Opening the same route with a fresh query restored the app in the owner's tab. This establishes stale launch HTML referencing removed release assets as the reproduced failure, rather than an authentication or catalogue-data failure.

Change scope: hosted launch document cache headers and build-time startup recovery only. Customer/manual theme source and Firebase records remain unchanged.

- Launch pages and `/storefront/index.html` send `Cache-Control: no-store` plus CDN no-store.
- Launch ETag hashes actual document content rather than reproducible file size/timestamp.
- Build embeds a visible startup notice and recovery handler before Expo scripts. Missing same-origin Expo scripts or lazy-chunk errors trigger one fresh-document reload, preserving the route/query/hash. Repeated failure shows a retry link instead of looping. No credentials or stored customer data are cleared.
- Slow startup has a visible retry. Normal mounting hides the notice.

Validation: eight focused Node tests PASS; targeted ESLint PASS. Tests cover missing initial chunks, loop prevention, late chunk failure, unrelated image errors, normal/slow startup, idempotent injection and different ETags for equal-size release documents. Hosting build and live response verification recorded after rollout.

Rollback: previous successful source commit `5e2127a` in Firebase App Hosting. No database migration or live data writes.
