# Gift4U P0 - Secure Places Backend Proxy

This web/backend patch supports the mobile P0 native address autocomplete without exposing a Google Places server key to the app.

## Added routes

```text
GET /api/places/autocomplete?q=<text>&sessionToken=<token>
GET /api/places/details?placeId=<id>&sessionToken=<token>
```

Both routes:

- require the existing Firebase bearer-token authentication
- use the existing Gift4U rate limiter
- return `Cache-Control: private, no-store`
- keep the Google key on the server

## Configure

Enable **Places API (New)** in the backend Google Cloud project and set this only in the Next.js server/hosting environment:

```env
GOOGLE_PLACES_SERVER_API_KEY=...
```

Do not commit the key and do not expose it as `NEXT_PUBLIC_` or `EXPO_PUBLIC_`.

For local Next.js testing you may place the server-only value in the web project's local environment file according to the project's existing environment workflow, then restart the server.

Manual address entry in the mobile app remains available when this service is not configured.

## Verify

With the web project's dependencies installed:

```powershell
node --import tsx --test tests/p0-places.test.ts
npm run lint
npm run build
```
