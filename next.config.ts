import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/dashboard-bg.svg",
        headers: [{ key: "Cache-Control", value: "public, max-age=86400" }],
      },
    ];
  },
  turbopack: {
    root: __dirname,
  },
  experimental: {
    // Keep pages the user just visited for 30s so tabbing back and forth is
    // instant. Server actions clear this cache, so edits still show at once.
    staleTimes: { dynamic: 30 },
    serverActions: {
      bodySizeLimit: "5mb",
    },
  },
};

export default withSentryConfig(nextConfig, {
  org: "vaulted-9u",
  project: "vaulted",
  silent: true,
  widenClientFileUpload: true,
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
  },
});
