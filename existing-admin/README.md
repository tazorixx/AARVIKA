# Next.js production build type-check hotfix

Build error fixed:

- `src/lib/catalog/server.ts`: TS7022 on `parentSnap`
- `src/lib/catalog/server.ts`: TS7022 on `nextParentId`

Root cause: TypeScript's strict inference in the category ancestor traversal loop could not stably infer the Firestore snapshot/data types across the loop assignment.

Fix: explicitly type the Firestore `DocumentSnapshot`, normalize its data to `Partial<Category> | undefined`, and explicitly type the next parent id as `string | null`. No catalog behavior or Firestore schema was changed.

After replacing the file, run:

```powershell
npm run build
```
