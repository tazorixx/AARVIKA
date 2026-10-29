<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Gift4U Project Rules & Architecture Decisions

## 1. Hosting & Deployment Target
- **Current owner-approved target (29 October 2026)**: Firebase App Hosting for the copied AARVIKA admin and shared mobile storefront in `gift4u-4210f`. This explicit authorization supersedes the earlier Netlify-only hosting restriction.
- Preserve the isolated local launcher. Deploy only the intended App Hosting backend; do not automatically deploy database rules or seed/migrate production records.
- Keep server secrets in Secret Manager and use managed Firebase server credentials. Never put private keys in mobile code or Git.

## 2. Authentication
- **Implemented Method**: Firebase Email/Password authentication ONLY (`signInWithEmailAndPassword`, `createUserWithEmailAndPassword`).
- Do NOT assume Google Auth or OAuth providers unless explicitly instructed.

## 3. Inventory Mutation Pattern
- Always follow the **`reserve -> sold / available`** pattern established in Phase 1:
  - Available stock: `Math.max(0, quantity - reserved)`.
  - On checkout/pending payment: increment `reserved`.
  - On payment success: decrement `reserved`, increment `sold`, decrement `quantity`.
  - On payment failure / order cancellation: decrement `reserved`.
  - NEVER perform naive decrements on `quantity`.

## 4. Order ID Generation
- Order IDs must use collision-safe, transactional reservation against Firestore (following the exact pattern of catalog slug locks in `src/lib/catalog/slugs.ts`), preventing race conditions.

## 5. Payments & Business Scope
- **COD (Cash on Delivery)**: NOT enabled by default. Requires explicit business approval from the user before introducing.

