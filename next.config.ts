import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for Docker deployment
  // This creates a minimal production bundle
  output: "standalone",

  // Disable telemetry in production
  ...(process.env.NODE_ENV === "production" && {
    experimental: {
      // Optimize for production
    },
  }),
};

export default nextConfig;

