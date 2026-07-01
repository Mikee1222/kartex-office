import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  // Prevent Next.js from inferring /Users/mikee (parent lockfile) as workspace root.
  outputFileTracingRoot: projectRoot,
  // Allow large multipart uploads to reach route handlers (middleware buffers the body).
  experimental: {
    middlewareClientMaxBodySize: "50mb",
  },
  // Hide the Next.js dev-tools badge (bottom-left triangle in development).
  devIndicators: false,
  // Omit X-Powered-By: Next.js response header.
  poweredByHeader: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "fqmolesnvdknrxfzopio.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  serverExternalPackages: ["sharp"],
};

export default nextConfig;
