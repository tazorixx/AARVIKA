/**
 * The previous generated registry used static references to local merchandising WebP files
 * for images that are absent from the supplied source archive. Metro resolves
 * static requires at build time even if those cards are not displayed.
 *
 * Real published images are read from the catalogue and/or ImageKit by
 * LocalDemoImage; do not import missing local files into the web bundle.
 * Restore this registry only when the matching assets are shipped with the app.
 */
export const categoryPhotoAssets: Record<string, number> = {};
