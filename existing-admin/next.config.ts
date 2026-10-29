import type { NextConfig } from "next";
import { resolve } from "node:path";

const nextConfig: NextConfig = {
  turbopack: { root: process.env.AARVIKA_APPHOSTING === 'true' ? __dirname : resolve(__dirname, "..") },
  output: process.env.AARVIKA_APPHOSTING === 'true' ? 'standalone' : undefined,
  allowedDevOrigins: ["10.51.233.94"],
  // Shared catalogue imports are bundled; keep App Hosting's standalone root at this app.
  outputFileTracingRoot: __dirname,
  async rewrites() {
    if (process.env.AARVIKA_APPHOSTING !== 'true') return [];
    const storefront = ['/', '/categories', '/search', '/offers', '/wishlist', '/account', '/location', '/cart', '/review', '/builder', '/orders', '/reminders', '/help', '/department/:id', '/category/:id', '/product/:id', '/wedding/products', '/wedding/tradition/:id', '/wedding/function/:id', '/furniture/inquiry', '/furniture/requests'];
    return {beforeFiles: [
      ...storefront.map(source => ({source, destination:'/storefront/index.html'})),
      {source:'/_expo/:path*',destination:'/storefront/_expo/:path*'},
      {source:'/assets/:path*',destination:'/storefront/assets/:path*'},
    ], afterFiles:[], fallback:[]};
  },
};

export default nextConfig;
