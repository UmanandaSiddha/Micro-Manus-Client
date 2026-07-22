import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    // Same-origin trick: all backend traffic flows through /api/* so cookies
    // are first-party. Mirrors the production Nginx path-routing.
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.API_URL ?? "http://localhost:4000"}/:path*`,
      },
    ];
  },
};

export default nextConfig;
