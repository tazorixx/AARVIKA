# Bootstrap the first SUPER_ADMIN

This is a one-time local operation. It is not a deployed API or Cloud Function.

1. Complete the normal Gift4U signup flow so the target account already exists in Firebase Authentication.
2. In Firebase Console, create/download a service-account JSON key.
3. Verify `.gitignore` already contains `.credentials/` and `*service-account*.json`.
4. Put the key at `.credentials/gift4u-firebase-adminsdk.json`.
5. From the project root run:

```powershell
node scripts/bootstrap-super-admin.mjs user@example.com
```

You can also pass the Firebase Auth UID instead of an email address.

The script sets the Firebase Auth custom claim `role: "SUPER_ADMIN"`. The service-account key never belongs in browser code or `.env.local`.

After the claim is assigned, the target user must sign out/in or otherwise obtain a fresh ID token before `/admin` recognizes the new role.

Delete the local service-account file when it is no longer needed, or keep it only in the ignored `.credentials/` directory with appropriate filesystem permissions.
