import type { NextConfig } from "next";
import { resolve } from "node:path";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";

const storefront = ['/', '/categories', '/search', '/offers', '/wishlist', '/account', '/location', '/cart', '/review', '/builder', '/orders', '/reminders', '/help', '/department/:id', '/category/:id', '/product/:id', '/wedding/products', '/wedding/tradition/:id', '/wedding/function/:id', '/furniture/inquiry', '/furniture/requests'];

const nextConfig: NextConfig = {
  turbopack: { root: process.env.AARVIKA_APPHOSTING === 'true' ? __dirname : resolve(__dirname, "..") },
  output: process.env.AARVIKA_APPHOSTING === 'true' ? 'standalone' : undefined,
  allowedDevOrigins: ["10.51.233.94"],
  // Shared catalogue imports are bundled; keep App Hosting's standalone root at this app.
  outputFileTracingRoot: __dirname,
  async headers() {
    if (process.env.AARVIKA_APPHOSTING !== 'true') return [];
    const launchTag='"'+createHash('sha256').update(readFileSync(resolve(__dirname,'public/storefront/index.html'))).digest('hex')+'"';
    // The launch document must never outlive its release's hashed Expo bundles.
    return [...storefront, '/storefront/index.html'].map(source => ({source, headers: [
      {key:'Cache-Control',value:'no-store, max-age=0'},
      {key:'CDN-Cache-Control',value:'no-store'},
      // Reproducible builds can share file size/mtime: use content, not static-file ETags.
      {key:'ETag',value:launchTag},
    ]}));
  },
  async rewrites() {
    if (process.env.AARVIKA_APPHOSTING !== 'true') return [];
    return {beforeFiles: [
      ...storefront.map(source => ({source, destination:'/storefront/index.html'})),
      {source:'/_expo/:path*',destination:'/storefront/_expo/:path*'},
      {source:'/assets/:path*',destination:'/storefront/assets/:path*'},
    ], afterFiles:[], fallback:[]};
  },
};

export default nextConfig;
