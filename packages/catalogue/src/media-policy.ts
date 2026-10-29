/** Public CDN references only. No requests, credentials or uploads happen here. */
export function isLocalMediaPath(value: unknown): value is string {
  return typeof value === 'string' && /^\/(?!\/)[a-zA-Z0-9_/.-]+\.(png|jpe?g|webp|svg)$/i.test(value) && !value.includes('..');
}
export function isImageKitReference(value: unknown): value is string {
  if (typeof value !== 'string' || /[\\\u0000-\u0020]/.test(value)) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname === 'ik.imagekit.io' && !url.port && !url.username && !url.password && !url.hash && /^\/[^/]+\/.+/.test(url.pathname) && !/%2f|%5c|%2e/i.test(url.pathname);
  } catch { return false; }
}
export function isCatalogueMedia(value: unknown): value is string { return isLocalMediaPath(value) || isImageKitReference(value); }
