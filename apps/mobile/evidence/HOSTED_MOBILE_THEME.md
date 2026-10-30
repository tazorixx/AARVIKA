# Hosted mobile theme — 30 October 2026

The owner's 14-second screen recording was compared with the existing mobile source and the previously deployed GitHub snapshot. The newer mobile theme and its 29 image assets were local and absent from the deployed snapshot.

Reuse the existing theme in the five-tab shell, home carousel and occasion cards, categories grid, account, offers, wishlist and product cards. Keep the published catalogue adapter, Firebase authentication and admin unchanged. Category overview uses the unobstructed grid from the reference; department pages retain their existing navigation rail. Home decor is a search shortcut, not a ninth department.

Focused corrections: use stable state-held Animated values for React compatibility; respect reduced motion; replace unverified delivery/returns claims with neutral collection labels; hide sample coupons in real catalogue mode; show demo product labels only in demo mode. Existing owner hero images remain available behind the new hero styling.

Validation before deployment:

- `npm run typecheck` in `apps/mobile`: PASS.
- Targeted ESLint on the changed mobile screens/components/theme: PASS, no warnings. Initial lint failures from animation refs were fixed before export.
- Production Expo web export: PASS, 1013 modules and 92 assets.
- `.local-preview/check-theme.cjs`: PASS at 320 × 844 and 390 × 844. Checked carousel controls, five tabs, category grid, Birthday navigation, real email account interface and absence of sample live coupons. Zero browser runtime errors. The exported candidate was tested against the real read-only published API using browser routing; no production records were written.
- Visual screenshots checked at both phone sizes against the recording.

No admin redesign, data-contract changes, database writes, image uploads or authentication changes. Rollback is the prior successful Firebase App Hosting rollout containing source commit `4de6261`.

Deployment: Firebase App Hosting confirmed the successful rollout of source commit `5e01737` on 30 October 2026 at the existing hosted address. `.local-preview/check-theme.cjs --live` passed the same 320px/390px checks plus automatic carousel advancement with normal motion enabled. Zero browser runtime errors. The actual hosted mobile screenshot was visually checked against the candidate and owner's recording.
