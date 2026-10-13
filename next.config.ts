import type { NextConfig } from "next";
import { contentSecurityPolicy } from "./config/csp";
import { LEGAL } from "./config/legal";

// No production launch without the legal notice's publisher (PLAN Q-11, LCEN art. 6 III).
if (process.env.VERCEL_ENV === "production" && !LEGAL.controller) {
  throw new Error("config/legal.ts: the data controller identity is missing (PLAN Q-11).");
}

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // No device API is needed; deny them by default (data minimisation).
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  {
    key: "Content-Security-Policy",
    value: contentSecurityPolicy({
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321",
      dev: process.env.NODE_ENV === "development",
    }),
  },
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
