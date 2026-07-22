import type { NextConfig } from "next";

// No proxy: the client calls the backend directly at NEXT_PUBLIC_API_URL
// (see lib/api.ts); the backend handles CORS + credentialed cookies.
const nextConfig: NextConfig = {};

export default nextConfig;
