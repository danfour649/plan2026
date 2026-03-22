import type { NextConfig } from "next";
// eslint-disable-next-line @typescript-eslint/no-require-imports -- bundle-analyzer is CJS
const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

/** Seconds — aligns `cacheLife("max")` + client router stale floors with app memo TTL (15 min). */
const CACHE_TTL_MIN_SECONDS = 60 * 15;

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self'",
      "connect-src 'self' https:",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  cacheLife: {
    max: {
      stale: CACHE_TTL_MIN_SECONDS,
      revalidate: 60 * 60 * 24 * 30,
      expire: 60 * 60 * 24 * 365,
    },
  },
  experimental: {
    staleTimes: {
      dynamic: CACHE_TTL_MIN_SECONDS,
      static: CACHE_TTL_MIN_SECONDS,
    },
  },
  poweredByHeader: false,
  reactStrictMode: true,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default withBundleAnalyzer(nextConfig);
