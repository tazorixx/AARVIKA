import type { NextConfig } from "next";
import { resolve } from "node:path";

const nextConfig: NextConfig = {
  turbopack: { root: resolve(__dirname, "..") },
  allowedDevOrigins: ["10.51.233.94"],
};

export default nextConfig;
