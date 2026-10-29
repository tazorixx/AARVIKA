Gift4U — Admin Login Separation Patch

Apply this patch to the canonical Gift4U root project:
C:\Users\ASUS\Desktop\gift4u

Changed files:
- src/app/login/page.tsx
- src/app/admin/login/page.tsx (NEW)
- src/app/admin/layout.tsx
- src/components/admin/AdminGuard.tsx
- src/components/admin/AdminNav.tsx
- src/lib/auth/redirect.ts

Behavior:
1. /login remains a normal customer/storefront login. Admin-role accounts are allowed to use it as customers.
2. /admin/login is the dedicated admin portal.
3. /admin/login explicitly rejects accounts without one of: SUPER_ADMIN, ADMIN, CATALOG_MANAGER, ORDER_MANAGER, SUPPORT.
4. Unauthenticated /admin/* routes redirect to /admin/login?next=...
5. Logged-in non-admin users trying /admin/* are sent to /admin/login?next=...
6. Admin logout goes to /admin/login.
7. Customer redirects reject the /admin namespace.
8. Admin redirects only accept /admin or /admin/* using a prefix/namespace check.
9. /admin/login bypasses AdminGuard/AdminNav so it cannot redirect to itself.
10. Admin login uses a separate professional admin-console visual style.

Verification performed on the patch source:
- TypeScript/TSX syntax transpilation passed for all 6 changed files.
- Full npm typecheck/build was not run because this uploaded source archive does not contain package.json/node_modules.

After applying:
npm run build

Manual checks:
A. /login + customer -> /account
B. /login + SUPER_ADMIN -> normal customer destination
C. /admin/login + SUPER_ADMIN -> /admin
D. /admin/login + customer -> clear administrator-access error
E. logged-out /admin/products -> /admin/login?next=/admin/products -> back to /admin/products after admin login
F. admin logout -> /admin/login
G. /login?next=/admin/products -> /account (customer redirect boundary)
